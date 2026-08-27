import { test, expect } from '@playwright/test';
import locatorsData from '../../data/locators/swag-lab.json';

test.describe('Hybrid Engine: hand-written coded scenarios', () => {
    
    test('[Code] Checkout total and tax calculation', async ({ page }) => {
        
        // 1. Precondition: log in
        await page.goto('https://www.saucedemo.com/');
        await page.locator(locatorsData.LoginPage.usernameInput).fill('standard_user');
        await page.locator(locatorsData.LoginPage.passwordInput).fill('secret_sauce');
        await page.locator(locatorsData.LoginPage.loginBtn).click();
        
        // 2. Add a product to the cart and go to checkout
        await page.locator(locatorsData.InventoryPage.bikeLightAddBtn).click();
        await page.locator(locatorsData.InventoryPage.cartIcon).click();
        await page.locator('#checkout').click();
        
        // 3. Fill the form (inline locators: this form is filled once, in this spec only)
        await page.locator('#first-name').fill('QA');
        await page.locator('#last-name').fill('Engineer');
        await page.locator('#postal-code').fill('700000');
        await page.locator('#continue').click();

        // 4. Arithmetic check
        const itemPriceText = await page.locator('.inventory_item_price').textContent();
        const taxText = await page.locator('.summary_tax_label').textContent();
        const totalText = await page.locator('.summary_total_label').textContent();

        // Parse the rendered text into decimals
        const itemPrice = parseFloat(itemPriceText!.replace('$', ''));
        const actualTax = parseFloat(taxText!.replace('Tax: $', ''));
        const actualTotal = parseFloat(totalText!.replace('Total: $', ''));

        // Tax is 8 percent
        const expectedTax = +(itemPrice * 0.08).toFixed(2);
        const expectedTotal = +(itemPrice + expectedTax).toFixed(2);

        expect(actualTax).toBe(expectedTax);
        expect(actualTotal).toBe(expectedTotal);
        
        // 5. Finish the order
        await page.locator('#finish').click();
        await expect(page.locator('.complete-header')).toHaveText('Thank you for your order!');
    });
});