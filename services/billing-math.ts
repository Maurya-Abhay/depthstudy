import type { PlanDefinition, BillingModel } from '@/services/plans';

export type BillingCycle = 'monthly' | 'yearly';
export type BillingLine = {
  description: string;
  kind: string;
  quantity: number;
  unitAmount: number;
  amount: number;
};

export type InvoiceCalcInput = {
  plan: Pick<PlanDefinition, 'billing_model' | 'monthly_price' | 'yearly_price' | 'included_student_seats' | 'extra_student_seat_price' | 'included_faculty_seats' | 'extra_faculty_seat_price'>;
  cycle: BillingCycle;
  activeStudents: number;
  faculty: number;
  taxRate?: number; // e.g. 0.18 for 18%
};

export type InvoiceCalcResult = {
  baseAmount: number;
  extraSeats: number;
  extraFaculties: number;
  extraSeatCharge: number;
  extraFacultyCharge: number;
  taxAmount: number;
  totalAmount: number;
  lines: BillingLine[];
};

function priceFor(plan: InvoiceCalcInput['plan'], cycle: BillingCycle): number {
  return cycle === 'yearly' ? Number(plan.yearly_price) : Number(plan.monthly_price);
}

/**
 * Pure billing calculation shared by server pages and admin billing API.
 * Never mutates state; callers persist the result.
 */
export function calculateOrganizationInvoice(input: InvoiceCalcInput): InvoiceCalcResult {
  const plan = input.plan;
  const model: BillingModel = plan.billing_model;
  const price = priceFor(plan, input.cycle);
  const activeStudents = Math.max(0, Math.floor(Number(input.activeStudents) || 0));
  const faculty = Math.max(0, Math.floor(Number(input.faculty) || 0));
  const includedStudents = Math.max(0, Math.floor(Number(plan.included_student_seats) || 0));
  const includedFaculty = Math.max(0, Math.floor(Number(plan.included_faculty_seats) || 0));
  const extraSeats = Math.max(0, activeStudents - includedStudents);
  const extraFaculties = Math.max(0, faculty - includedFaculty);

  let baseAmount = 0;
  let baseDescription = `${cycleLabel(input.cycle)} base fee`;
  let baseQuantity = 1;
  let baseUnitAmount = price;

  if (model === 'flat') {
    baseAmount = price;
    baseDescription = `${cycleLabel(input.cycle)} flat organization fee`;
  } else if (model === 'per_student') {
    baseAmount = Math.round(activeStudents * price * 100) / 100;
    baseDescription = `${cycleLabel(input.cycle)} per-student fee`;
    baseQuantity = activeStudents;
    baseUnitAmount = price;
  } else if (model === 'per_seat') {
    baseAmount = price;
    baseDescription = `${cycleLabel(input.cycle)} included seat plan`;
  } else {
    baseAmount = price;
    baseDescription = `${cycleLabel(input.cycle)} hybrid base fee`;
  }

  // Extra seat/faculty charges apply only when a finite included-seat allowance exists.
  const extraSeatCharge = includedStudents > 0 ? Math.round(extraSeats * Number(plan.extra_student_seat_price) * 100) / 100 : 0;
  const extraFacultyCharge = includedFaculty > 0 ? Math.round(extraFaculties * Number(plan.extra_faculty_seat_price) * 100) / 100 : 0;
  const subtotal = Math.round((baseAmount + extraSeatCharge + extraFacultyCharge) * 100) / 100;
  const taxRate = Math.max(0, Number(input.taxRate ?? 0.18));
  const taxAmount = Math.round(subtotal * taxRate * 100) / 100;
  const totalAmount = Math.round((subtotal + taxAmount) * 100) / 100;

  const lines: BillingLine[] = [{
    description: baseDescription,
    kind: 'base',
    quantity: baseQuantity,
    unitAmount: baseUnitAmount,
    amount: Math.round(baseAmount * 100) / 100,
  }];
  if (extraSeats > 0 && extraSeatCharge > 0) lines.push({
    description: `Additional student seats (${extraSeats} × ${Number(plan.extra_student_seat_price)})`,
    kind: 'extra_seat', quantity: extraSeats, unitAmount: Number(plan.extra_student_seat_price), amount: extraSeatCharge,
  });
  if (extraFaculties > 0 && extraFacultyCharge > 0) lines.push({
    description: `Additional faculty seats (${extraFaculties} × ${Number(plan.extra_faculty_seat_price)})`,
    kind: 'extra_faculty', quantity: extraFaculties, unitAmount: Number(plan.extra_faculty_seat_price), amount: extraFacultyCharge,
  });
  if (taxAmount > 0) lines.push({ description: `Tax (${Math.round(taxRate * 100)}%)`, kind: 'tax', quantity: 1, unitAmount: taxAmount, amount: taxAmount });

  return { baseAmount: Math.round(baseAmount * 100) / 100, extraSeats, extraFaculties, extraSeatCharge, extraFacultyCharge, taxAmount, totalAmount, lines };
}

function cycleLabel(cycle: BillingCycle): string {
  return cycle === 'yearly' ? 'Yearly' : 'Monthly';
}

export function billingPeriodFor(cycle: BillingCycle, now: Date): { start: Date; end: Date } {
  if (cycle === 'yearly') {
    const start = new Date(now.getFullYear(), 0, 1);
    const end = new Date(now.getFullYear() + 1, 0, 1);
    return { start, end };
  }
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return { start, end };
}

export function nextBillingDate(cycle: BillingCycle, from: Date): Date {
  if (cycle === 'yearly') return new Date(from.getFullYear() + 1, 0, 1);
  return new Date(from.getFullYear(), from.getMonth() + 1, 1);
}
