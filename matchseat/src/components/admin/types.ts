export type AdminMatch = {
  id: string;
  slug: string;
  homeTeam: string;
  awayTeam: string;
  homeFlag: string | null;
  awayFlag: string | null;
  stage: string;
  groupName: string | null;
  kickoffAt: string;
  venueName: string;
  venueCity: string;
  venueState: string;
  venueCapacity: number | null;
  coverImage: string | null;
  description: string | null;
  isFeatured: boolean;
  isPublished: boolean;
  basicStock: number;
  premiumStock: number;
};

export type AdminOrderItem = {
  id: string;
  seatTier: string;
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
  sectionLabel: string | null;
  match: AdminMatch;
};

export type AdminOrder = {
  id: string;
  orderNumber: string;
  guestEmail: string | null;
  guestName: string | null;
  guestPhone: string | null;
  status: string;
  paymentStatus: string;
  paymentMethodName: string | null;
  paymentUrlUsed: string | null;
  subtotalCents: number;
  totalCents: number;
  ticketCount: number;
  notes: string | null;
  billingCity: string | null;
  billingState: string | null;
  billingZip: string | null;
  createdAt: string;
  updatedAt: string;
  user?: {
    email: string;
    firstName: string;
    lastName: string;
  } | null;
  paymentMethod?: AdminPaymentMethod | null;
  items: AdminOrderItem[];
};

export type AdminPaymentOverride = {
  id: string;
  paymentMethodId: string;
  amountCents: number;
  paymentUrl: string;
  isActive: boolean;
};

export type AdminPaymentMethod = {
  id: string;
  code: string;
  name: string;
  iconUrl: string | null;
  urlTemplate: string;
  buttonText: string;
  instructions: string | null;
  isActive: boolean;
  sortOrder: number;
  overrides: AdminPaymentOverride[];
};

export type AdminConversationMessage = {
  id: string;
  senderType: string;
  senderName: string | null;
  body: string;
  createdAt: string;
};

export type AdminConversation = {
  id: string;
  guestName: string | null;
  guestEmail: string | null;
  status: string;
  lastMessageAt: string;
  createdAt: string;
  assignedTo?: { name: string; email: string } | null;
  user?: { firstName: string; lastName: string; email: string } | null;
  messages: AdminConversationMessage[];
};
