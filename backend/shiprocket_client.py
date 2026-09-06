import os
import requests
import datetime
import secrets

SHIPROCKET_EMAIL = os.getenv("SHIPROCKET_EMAIL", "")
SHIPROCKET_PASSWORD = os.getenv("SHIPROCKET_PASSWORD", "")

_cached_token = None
_token_expiry = None


def is_shiprocket_configured():
    return bool(SHIPROCKET_EMAIL and SHIPROCKET_PASSWORD)


def get_shiprocket_token():
    """Authenticate with Shiprocket API to obtain Bearer Token."""
    global _cached_token, _token_expiry
    if not is_shiprocket_configured():
        return None

    now = datetime.datetime.now()
    if _cached_token and _token_expiry and now < _token_expiry:
        return _cached_token

    try:
        url = "https://apiv2.shiprocket.in/v1/external/auth/login"
        payload = {"email": SHIPROCKET_EMAIL, "password": SHIPROCKET_PASSWORD}
        res = requests.post(url, json=payload, timeout=10)
        res.raise_for_status()
        data = res.json()
        _cached_token = data.get("token")
        _token_expiry = now + datetime.timedelta(days=9)
        return _cached_token
    except Exception as e:
        print(f"[Shiprocket Auth Error] {e}")
        return None


def create_shiprocket_order(order_data: dict) -> dict:
    """
    Create an ad-hoc shipment order in Shiprocket.
    order_data expects:
      - order_number
      - customer_name
      - customer_email
      - customer_phone
      - shipping_address (dict with street, city, state, pincode)
      - items (list of dicts)
      - total_amount
    """
    token = get_shiprocket_token()

    if not token:
        # Simulation Mode when Shiprocket credentials are not yet entered
        fake_shipment_id = f"SR_SHIP_{secrets.token_hex(6).upper()}"
        fake_tracking_no = f"EBTRK{secrets.token_hex(4).upper()}"
        return {
            "is_demo": True,
            "shiprocket_order_id": fake_shipment_id,
            "shipment_id": fake_shipment_id,
            "status": "Manifested (Demo Mode)",
            "tracking_number": fake_tracking_no,
            "courier_name": "Delhivery / Blue Dart (Simulated)"
        }

    try:
        now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
        address = order_data.get("shipping_address", {})

        order_items = []
        for item in order_data.get("items", []):
            order_items.append({
                "name": item.get("name", "Handcrafted Candle"),
                "sku": f"SKU-{item.get('id', 'item')}",
                "units": item.get("quantity", 1),
                "selling_price": item.get("price", 0),
                "discount": 0
            })

        payload = {
            "order_id": order_data["order_number"],
            "order_date": now_str,
            "pickup_location": os.getenv("SHIPROCKET_PICKUP_LOCATION", "Primary"),
            "billing_customer_name": order_data.get("customer_name", "Customer"),
            "billing_last_name": "",
            "billing_address": address.get("street", "Address"),
            "billing_city": address.get("city", "City"),
            "billing_pincode": address.get("pincode", "110001"),
            "billing_state": address.get("state", "State"),
            "billing_country": "India",
            "billing_email": order_data.get("customer_email", "customer@example.com"),
            "billing_phone": order_data.get("customer_phone", "9999999999"),
            "shipping_is_billing": True,
            "order_items": order_items,
            "payment_method": "Prepaid",
            "sub_total": order_data.get("total_amount", 0),
            "length": 15,
            "breadth": 15,
            "height": 10,
            "weight": 0.5  # Standard average 500g package
        }

        url = "https://apiv2.shiprocket.in/v1/external/orders/create/adhoc"
        headers = {"Authorization": f"Bearer {token}"}
        res = requests.post(url, json=payload, headers=headers, timeout=12)
        res.raise_for_status()
        data = res.json()

        return {
            "is_demo": False,
            "shiprocket_order_id": str(data.get("order_id", "")),
            "shipment_id": str(data.get("shipment_id", "")),
            "status": data.get("status", "NEW"),
            "tracking_number": str(data.get("awb_code", "Pending Assignment")),
            "courier_name": data.get("courier_name", "Assigned on Pickup")
        }
    except Exception as e:
        print(f"[Shiprocket Order Creation Error] {e}")
        fake_shipment_id = f"SR_ERR_{secrets.token_hex(4).upper()}"
        return {
            "is_demo": True,
            "shiprocket_order_id": fake_shipment_id,
            "shipment_id": fake_shipment_id,
            "status": "Pending Manual Dispatch",
            "tracking_number": "Pending",
            "error_note": str(e)
        }
