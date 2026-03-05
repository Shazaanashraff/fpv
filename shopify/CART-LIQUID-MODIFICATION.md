# Cart.liquid Modification Guide

This file shows you how to modify your Shopify cart page to require phone verification before checkout.

## 🎯 Goal

Replace the checkout button with a conditional check:
- **If customer has phone**: Show normal checkout button
- **If customer has NO phone**: Show "Verify Phone to Checkout" button
- **If not logged in**: Show "Login to Checkout" button

---

## 📍 Where to Find cart.liquid

1. Go to **Shopify Admin** → **Online Store** → **Themes**
2. Click **Actions** → **Edit code**
3. Look in these locations:
   - **Sections** folder → `cart-template.liquid` or `main-cart.liquid`
   - **Templates** folder → `cart.liquid`
   - **Snippets** folder → `cart-template.liquid`

**Note:** Newer themes use sections, older themes use templates.

---

## 🔍 Find the Checkout Button

Search for one of these in your cart file:
- `checkout` (the word)
- `type="submit"`
- `name="checkout"`
- `cart__checkout` (class name)

Example patterns you might see:
```liquid
<button type="submit" name="checkout">Checkout</button>
```

```liquid
<a href="/checkout" class="btn">Proceed to Checkout</a>
```

```liquid
{{ 'Checkout' | t }}
```

---

## ✏️ Modification Code

Once you find the checkout button, **wrap it** with the following Liquid code:

### Option A: If using a `<button>` element

**BEFORE:**
```liquid
<button type="submit" name="checkout" class="btn">
  Checkout
</button>
```

**AFTER:**
```liquid
{% if customer %}
  {% if customer.phone == blank %}
    {%- comment -%} Customer logged in but no phone - redirect to verification {%- endcomment -%}
    <a href="/pages/phone-verification?return=/checkout" class="btn btn--full" style="display: block; text-align: center; text-decoration: none;">
      Verify Phone to Checkout
    </a>
    <p style="text-align: center; margin-top: 8px; font-size: 13px; color: #666;">
      Phone verification required for checkout
    </p>
  {% else %}
    {%- comment -%} Customer has phone - show normal checkout {%- endcomment -%}
    <button type="submit" name="checkout" class="btn">
      Checkout
    </button>
  {% endif %}
{% else %}
  {%- comment -%} Not logged in - require login {%- endcomment -%}
  <a href="/account/login?return_url=/cart" class="btn btn--full" style="display: block; text-align: center; text-decoration: none;">
    Login to Checkout
  </a>
  <p style="text-align: center; margin-top: 8px; font-size: 13px; color: #666;">
    Please login to proceed with checkout
  </p>
{% endif %}
```

---

### Option B: If using an `<a>` link element

**BEFORE:**
```liquid
<a href="/checkout" class="button">Proceed to Checkout</a>
```

**AFTER:**
```liquid
{% if customer %}
  {% if customer.phone == blank %}
    {%- comment -%} No phone - redirect to verification {%- endcomment -%}
    <a href="/pages/phone-verification?return=/checkout" class="button">
      Verify Phone to Checkout
    </a>
    <p style="text-align: center; margin-top: 8px; font-size: 13px; color: #666;">
      Phone verification required for checkout
    </p>
  {% else %}
    {%- comment -%} Has phone - normal checkout {%- endcomment -%}
    <a href="/checkout" class="button">Proceed to Checkout</a>
  {% endif %}
{% else %}
  {%- comment -%} Not logged in {%- endcomment -%}
  <a href="/account/login?return_url=/cart" class="button">
    Login to Checkout
  </a>
  <p style="text-align: center; margin-top: 8px; font-size: 13px; color: #666;">
    Please login to proceed with checkout
  </p>
{% endif %}
```

---

## 🎨 Styling Tips

The button classes depend on your theme. Common class names:
- `btn`
- `button`
- `btn--primary`
- `cart__checkout-button`

**Keep the same classes** from your original checkout button to maintain styling.

---

## ✅ Testing Checklist

After making changes:

1. **Test with verified customer**
   - Log in with account that has phone number
   - Add item to cart
   - Should see normal "Checkout" button
   - Click → goes to checkout page

2. **Test with unverified customer**
   - Log in with account WITHOUT phone number
   - Add item to cart
   - Should see "Verify Phone to Checkout" button
   - Click → redirects to `/pages/phone-verification?return=/checkout`
   - Complete OTP → redirects back to checkout

3. **Test logged out**
   - Log out
   - Add item to cart
   - Should see "Login to Checkout" button
   - Click → redirects to login page

---

## 🔒 Require Login for Checkout (Important!)

To enforce that customers must be logged in:

1. Go to **Shopify Admin** → **Settings** → **Checkout**
2. Scroll to **Customer accounts** section
3. Select **"Accounts are required"**
4. Click **Save**

This prevents guests from accessing checkout without logging in.

---

## 🚨 Troubleshooting

**Issue:** Button looks unstyled
- **Fix:** Use the same CSS classes from your original button

**Issue:** Still can access checkout without phone
- **Fix:** This only blocks the cart button. Shopify Growth plan cannot block the actual checkout page URL. Users determined to bypass could type `/checkout` directly. Consider upgrading to Shopify Plus for full checkout customization.

**Issue:** "Verify Phone to Checkout" button doesn't redirect
- **Fix:** Ensure the page `/pages/phone-verification` exists in your Shopify admin (Online Store → Pages)

**Issue:** Customer object is always null
- **Fix:** Ensure "Accounts are required" is enabled in Settings → Checkout

---

## 📝 Example: Full Cart Section Code

Here's a complete example of a typical cart section with verification added:

```liquid
<div class="cart__footer">
  <div class="cart__total">
    <p class="cart__total-label">Subtotal:</p>
    <p class="cart__total-price">{{ cart.total_price | money }}</p>
  </div>

  <div class="cart__buttons">
    {% if customer %}
      {% if customer.phone == blank %}
        <a href="/pages/phone-verification?return=/checkout" class="btn btn--full">
          Verify Phone to Checkout
        </a>
        <p style="text-align: center; margin-top: 8px; font-size: 13px; color: #666;">
          Phone verification required for checkout
        </p>
      {% else %}
        <button type="submit" name="checkout" class="btn btn--full">
          Checkout
        </button>
      {% endif %}
    {% else %}
      <a href="/account/login?return_url=/cart" class="btn btn--full">
        Login to Checkout
      </a>
      <p style="text-align: center; margin-top: 8px; font-size: 13px; color: #666;">
        Please login to proceed with checkout
      </p>
    {% endif %}
  </div>
</div>
```

---

## 🎯 Summary

1. Find your checkout button in cart.liquid (or cart section file)
2. Replace with the conditional logic above
3. Maintain the same CSS classes for styling
4. Enable "Accounts are required" in Shopify settings
5. Test all three scenarios (verified, unverified, logged out)

**Result:** Customers without verified phone numbers will be redirected to verify before accessing checkout!
