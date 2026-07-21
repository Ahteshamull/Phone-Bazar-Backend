import { CounterModel } from "../models/Counter.js";
function makeInvoice(prefix, sequence) {
    return `${prefix}-${new Date().getFullYear()}-${String(sequence).padStart(5, "0")}`;
}
async function nextSequence(key) {
    const counter = await CounterModel.findOneAndUpdate({ key }, { $inc: { sequence: 1 } }, { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }).lean();
    return counter?.sequence ?? 1;
}
export async function nextPhoneInvoiceNumber() {
    return makeInvoice("INV", await nextSequence("phone_invoice"));
}
export async function nextGadgetInvoiceNumber() {
    return makeInvoice("G-INV", await nextSequence("gadget_invoice"));
}
