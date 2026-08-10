import { test, expect } from '@playwright/test';
import locatorsData from '../../data/locators/swag-lab.json';

test.describe('Hybrid Engine: Luồng Code tay (Coded Scenarios)', () => {
    
    test('[Code] Verify logic tính tổng tiền và Thuế tại Checkout', async ({ page }) => {
        
        // 1. Tiền điều kiện: Đăng nhập
        await page.goto('https://www.saucedemo.com/');
        await page.locator(locatorsData.LoginPage.usernameInput).fill('standard_user');
        await page.locator(locatorsData.LoginPage.passwordInput).fill('secret_sauce');
        await page.locator(locatorsData.LoginPage.loginBtn).click();
        
        // 2. Thêm sản phẩm vào giỏ hàng và tới trang Checkout
        await page.locator(locatorsData.InventoryPage.bikeLightAddBtn).click();
        await page.locator(locatorsData.InventoryPage.cartIcon).click();
        await page.locator('#checkout').click();
        
        // 3. Điền Form (Hardcode locator cho các form điền 1 lần)
        await page.locator('#first-name').fill('QA');
        await page.locator('#last-name').fill('Engineer');
        await page.locator('#postal-code').fill('700000');
        await page.locator('#continue').click();

        // 4. XỬ LÝ LOGIC TOÁN HỌC
        const itemPriceText = await page.locator('.inventory_item_price').textContent();
        const taxText = await page.locator('.summary_tax_label').textContent();
        const totalText = await page.locator('.summary_total_label').textContent();

        // Chuyển đổi text thành số thập phân
        const itemPrice = parseFloat(itemPriceText!.replace('$', ''));
        const actualTax = parseFloat(taxText!.replace('Tax: $', ''));
        const actualTotal = parseFloat(totalText!.replace('Total: $', ''));

        // Kiểm tra logic: Thuế 8%
        const expectedTax = +(itemPrice * 0.08).toFixed(2);
        const expectedTotal = +(itemPrice + expectedTax).toFixed(2);

        expect(actualTax).toBe(expectedTax);
        expect(actualTotal).toBe(expectedTotal);
        
        // 5. Hoàn tất đơn hàng
        await page.locator('#finish').click();
        await expect(page.locator('.complete-header')).toHaveText('Thank you for your order!');
    });
});