import { prisma } from "@/lib/db";

/**
 * Confirm payment and commit inventory exactly once.
 * Call from webhook, assisted payment, or admin manual confirm.
 */
export async function confirmOrderPayment(opts: {
  orderId: string;
  paymentMethodName?: string;
  adminNotesAppend?: string;
  transactionRef?: string;
}) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: opts.orderId },
      include: { items: true },
    });
    if (!order) throw new Error("Order not found");
    if (order.paymentStatus === "CONFIRMED") {
      return order; // idempotent
    }
    if (order.paymentStatus !== "PENDING" && order.paymentStatus !== "AWAITING_ASSISTED") {
      throw new Error(`Cannot confirm payment from status ${order.paymentStatus}`);
    }

    // Commit inventory now (not at checkout)
    for (const item of order.items) {
      if (item.variantId) {
        const variant = await tx.productVariant.findUnique({ where: { id: item.variantId } });
        if (!variant || variant.stockQuantity < item.quantity) {
          throw new Error(`Insufficient stock for ${item.productName}`);
        }
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stockQuantity: { decrement: item.quantity } },
        });
      } else if (item.productId) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        if (!product || product.stockQuantity < item.quantity) {
          throw new Error(`Insufficient stock for ${item.productName}`);
        }
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stockQuantity: { decrement: item.quantity },
            salesCount: { increment: item.quantity },
          },
        });
      }
    }

    if (order.couponCode) {
      await tx.coupon.updateMany({
        where: { code: order.couponCode },
        data: { usedCount: { increment: 1 } },
      });
    }

    const notes = [
      order.adminNotes,
      opts.adminNotesAppend,
      opts.transactionRef ? `txn=${opts.transactionRef}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    return tx.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: "CONFIRMED",
        status: "PAYMENT_CONFIRMED",
        paymentMethodName: opts.paymentMethodName || order.paymentMethodName,
        adminNotes: notes || order.adminNotes,
      },
      include: { items: true, paymentMethod: true },
    });
  });
}
