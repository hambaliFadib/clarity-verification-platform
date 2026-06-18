import { NextResponse } from "next/server";

// Mock scenario data
const scenarios = [
  "Login Scenario",
  "Registration Scenario",
  "Password Reset Scenario",
  "Checkout Scenario",
  "Refund Scenario",
];

export async function GET() {
  return NextResponse.json(scenarios);
}
