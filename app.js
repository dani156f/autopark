import { chromium } from "playwright";
import { listVehicles } from "./db.js";

async function registerAll() {
  try {
    const vehicles = listVehicles();

    vehicles.forEach((vehicle) => {
      registerVehicle(vehicle.license, vehicle.phone);
    });
  } catch (err) {
    console.log("error with pulling vihecles", err);
  }
}

async function registerVehicle(license, phoneNumber) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto(
    "https://online.mobilparkering.dk/12cdf204-d969-469a-9bd5-c1f1fc59ee34"
  );

  // Fill in the license plate
  await page.fill("#inline-full-name", license);

  // Fill in the phone number (optional)
  await page.fill(
    'input[placeholder="Indtast mobilnummer (valgfri)"]',
    phoneNumber
  );

  console.log("✅ Fields filled");

  // Clicking the "accpet terms and conditions" and "forsæt" buttons

  // Accept terms and conditions (checkbox)
  await page.getByLabel("Jeg accepterer").check();

  // Click the "Fortsæt" button
  await page.getByText("Fortsæt").click();

  await page.waitForURL(
    "https://online.mobilparkering.dk/12cdf204-d969-469a-9bd5-c1f1fc59ee34/confirm"
  );

  await page.getByText("Bekræft og opret").click();

  await page.waitForURL(
    "https://online.mobilparkering.dk/12cdf204-d969-469a-9bd5-c1f1fc59ee34/receipt"
  );

  // Take screenshot for debugging
  //await page.screenshot({ path: "filled-form.png" });

  console.log("Parking sucessfully registered for", license);

  await browser.close();
}

registerAll();
