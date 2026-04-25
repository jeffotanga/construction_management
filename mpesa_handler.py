"""
M-Pesa Payment Integration
Handles M-Pesa STK Push, payment initiation, and verification
"""

import requests
import base64
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()


class MpesaConfig:
    """M-Pesa Configuration"""
    
    # Use Safaricom Sandbox for development
    BASE_URL = os.getenv('MPESA_BASE_URL', 'https://sandbox.safaricom.co.ke')
    CONSUMER_KEY = os.getenv('MPESA_CONSUMER_KEY', '')
    CONSUMER_SECRET = os.getenv('MPESA_CONSUMER_SECRET', '')
    SHORTCODE = os.getenv('MPESA_SHORTCODE', '')
    PASSKEY = os.getenv('MPESA_PASSKEY', '')
    CALLBACK_URL = os.getenv('MPESA_CALLBACK_URL', 'http://localhost:5000/api/payments/mpesa/callback')
    TIMEOUT_URL = os.getenv('MPESA_TIMEOUT_URL', 'http://localhost:5000/api/payments/mpesa/timeout')


class MpesaPaymentHandler:
    """Handle M-Pesa payment operations"""
    
    def __init__(self):
        self.config = MpesaConfig()
        self.access_token = None
        self.token_expiry = None
        
    def get_access_token(self):
        """
        Get M-Pesa API access token
        
        Returns:
            str: Access token or None if failed
        """
        try:
            url = f"{self.config.BASE_URL}/oauth/v1/generate?grant_type=client_credentials"
            
            auth_string = f"{self.config.CONSUMER_KEY}:{self.config.CONSUMER_SECRET}"
            encoded_auth = base64.b64encode(auth_string.encode()).decode()
            
            headers = {
                'Authorization': f'Basic {encoded_auth}'
            }
            
            response = requests.get(url, headers=headers, timeout=10)
            response.raise_for_status()
            
            self.access_token = response.json().get('access_token')
            return self.access_token
            
        except Exception as e:
            print(f"Error getting access token: {str(e)}")
            return None
    
    def initiate_payment(self, amount, phone_number, account_reference, description):
        """
        Initiate STK Push payment request
        
        Args:
            amount (float): Payment amount
            phone_number (str): Customer phone number (254xxxxxxxxx format)
            account_reference (str): Unique account reference
            description (str): Payment description
            
        Returns:
            dict: Response containing checkout request ID or error
        """
        try:
            # Get access token
            token = self.get_access_token()
            if not token:
                return {
                    'success': False,
                    'error': 'Failed to get access token'
                }
            
            # Prepare STK Push request
            url = f"{self.config.BASE_URL}/mpesa/stkpush/v1/processrequest"
            
            timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
            password = base64.b64encode(
                f"{self.config.SHORTCODE}{self.config.PASSKEY}{timestamp}".encode()
            ).decode()
            
            headers = {
                'Authorization': f'Bearer {token}',
                'Content-Type': 'application/json'
            }
            
            payload = {
                'BusinessShortCode': self.config.SHORTCODE,
                'Password': password,
                'Timestamp': timestamp,
                'TransactionType': 'CustomerPayBillOnline',
                'Amount': int(amount),
                'PartyA': phone_number,
                'PartyB': self.config.SHORTCODE,
                'PhoneNumber': phone_number,
                'CallBackURL': self.config.CALLBACK_URL,
                'TimeoutURL': self.config.TIMEOUT_URL,
                'AccountReference': account_reference,
                'TransactionDesc': description
            }
            
            response = requests.post(url, json=payload, headers=headers, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            
            if data.get('ResponseCode') == '0':
                return {
                    'success': True,
                    'checkout_request_id': data.get('CheckoutRequestID'),
                    'customer_message': data.get('CustomerMessage')
                }
            else:
                return {
                    'success': False,
                    'error': data.get('errorMessage', 'Payment initiation failed')
                }
                
        except Exception as e:
            print(f"Error initiating payment: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def query_payment_status(self, checkout_request_id):
        """
        Query the status of a payment
        
        Args:
            checkout_request_id (str): The checkout request ID from initiate_payment
            
        Returns:
            dict: Payment status details
        """
        try:
            token = self.get_access_token()
            if not token:
                return {
                    'success': False,
                    'error': 'Failed to get access token'
                }
            
            url = f"{self.config.BASE_URL}/mpesa/stkpushquery/v1/query"
            
            timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
            password = base64.b64encode(
                f"{self.config.SHORTCODE}{self.config.PASSKEY}{timestamp}".encode()
            ).decode()
            
            headers = {
                'Authorization': f'Bearer {token}',
                'Content-Type': 'application/json'
            }
            
            payload = {
                'BusinessShortCode': self.config.SHORTCODE,
                'Password': password,
                'Timestamp': timestamp,
                'CheckoutRequestID': checkout_request_id
            }
            
            response = requests.post(url, json=payload, headers=headers, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            
            if data.get('ResponseCode') == '0':
                return {
                    'success': True,
                    'result_code': data.get('ResultCode'),
                    'result_desc': data.get('ResultDesc'),
                    'amount': data.get('Amount'),
                    'mpesa_receipt_number': data.get('MpesaReceiptNumber')
                }
            else:
                return {
                    'success': False,
                    'error': data.get('errorMessage', 'Query failed')
                }
                
        except Exception as e:
            print(f"Error querying payment: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def process_callback(self, callback_data):
        """
        Process M-Pesa callback notification
        
        Args:
            callback_data (dict): Callback data from M-Pesa
            
        Returns:
            dict: Processed transaction details
        """
        try:
            body = callback_data.get('Body', {})
            stk_callback = body.get('stkCallback', {})
            
            result_code = stk_callback.get('ResultCode')
            result_desc = stk_callback.get('ResultDesc')
            checkout_request_id = stk_callback.get('CheckoutRequestID')
            
            callback_metadata = stk_callback.get('CallbackMetadata', {})
            item_list = callback_metadata.get('Item', [])
            
            transaction_data = {
                'result_code': result_code,
                'result_desc': result_desc,
                'checkout_request_id': checkout_request_id,
                'success': result_code == 0
            }
            
            # Extract transaction details from items
            for item in item_list:
                name = item.get('Name')
                value = item.get('Value')
                
                if name == 'Amount':
                    transaction_data['amount'] = value
                elif name == 'MpesaReceiptNumber':
                    transaction_data['mpesa_reference'] = value
                elif name == 'PhoneNumber':
                    transaction_data['phone_number'] = value
                elif name == 'TransactionDate':
                    transaction_data['transaction_date'] = value
            
            return transaction_data
            
        except Exception as e:
            print(f"Error processing callback: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }


# Helper function to validate phone number format
def validate_phone_number(phone):
    """
    Validate and format phone number for M-Pesa
    
    Args:
        phone (str): Phone number (any format)
        
    Returns:
        str: Formatted phone number or None if invalid
    """
    # Remove any non-digit characters
    digits = ''.join(c for c in phone if c.isdigit())
    
    # Check length (Kenya numbers should be 12 digits with 254 prefix)
    if len(digits) == 10:
        # Add 254 prefix (remove leading 0)
        return f"254{digits[1:]}"
    elif len(digits) == 12 and digits.startswith('254'):
        return digits
    else:
        return None
