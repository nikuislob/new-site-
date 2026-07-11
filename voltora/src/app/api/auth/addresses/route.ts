import { NextRequest } from "next/server";
import { requireCustomer, AuthError } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { addressSchema } from "@/lib/validators";
import { safeJson, errorJson } from "@/lib/utils";

export async function GET() {
  try {
    const user = await requireCustomer();
    const addresses = await prisma.address.findMany({
      where: { userId: user.id },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });
    return safeJson({ addresses });
  } catch (e) {
    if (e instanceof AuthError) return errorJson(e.message, e.status);
    return errorJson("Failed to fetch addresses", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireCustomer();
    const body = await req.json();
    const parsed = addressSchema.safeParse(body);
    if (!parsed.success) {
      return errorJson(parsed.error.issues[0]?.message || "Validation failed", 400);
    }

    if (parsed.data.isDefault) {
      await prisma.address.updateMany({
        where: { userId: user.id, isDefault: true },
        data: { isDefault: false },
      });
    }

    const address = await prisma.address.create({
      data: {
        userId: user.id,
        label: parsed.data.label || "Home",
        fullName: parsed.data.fullName,
        phone: parsed.data.phone || null,
        line1: parsed.data.line1,
        line2: parsed.data.line2 || null,
        city: parsed.data.city,
        state: parsed.data.state,
        zipCode: parsed.data.zipCode,
        country: parsed.data.country,
        isDefault: parsed.data.isDefault ?? false,
      },
    });

    return safeJson({ address }, 201);
  } catch (e) {
    if (e instanceof AuthError) return errorJson(e.message, e.status);
    return errorJson("Failed to create address", 500);
  }
}
