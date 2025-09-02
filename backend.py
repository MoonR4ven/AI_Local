from flask import Flask, request, jsonify
import json
import os
from pathlib import Path
import logging
from flask_cors import CORS  # <- import

app = Flask(__name__)
CORS(app)  # allows all origins

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Resolve paths relative to the script's directory
BASE_DIR = Path(__file__).resolve().parent
CATALOG_PATH = BASE_DIR / 'src' / 'memory' / 'catalog.txt'
PRODUCTS_PATH = BASE_DIR / 'src' / 'memory' / 'products.json'

# Ensure memory directory exists
MEMORY_DIR = BASE_DIR / 'src' / 'memory'
MEMORY_DIR.mkdir(parents=True, exist_ok=True)

def read_catalog() -> str:
    try:
        if not CATALOG_PATH.exists():
            logger.warning(f"Catalog file not found at {CATALOG_PATH}, creating empty file")
            CATALOG_PATH.write_text('')
            return ''
        return CATALOG_PATH.read_text()
    except Exception as e:
        logger.error(f"Error reading catalog: {e}")
        raise RuntimeError(f"Failed to read catalog: {str(e)}")

def write_catalog(content: str) -> None:
    try:
        CATALOG_PATH.write_text(content)
        logger.info(f"Successfully wrote to {CATALOG_PATH}")
    except Exception as e:
        logger.error(f"Error writing to catalog: {e}")
        raise RuntimeError(f"Failed to write catalog: {str(e)}")

def read_products() -> list:
    try:
        if not PRODUCTS_PATH.exists():
            logger.warning(f"Products file not found at {PRODUCTS_PATH}, creating empty file")
            PRODUCTS_PATH.write_text(json.dumps([]))
            return []
        return json.loads(PRODUCTS_PATH.read_text())
    except json.JSONDecodeError as e:
        logger.error(f"Invalid JSON in products file: {e}")
        raise RuntimeError(f"Invalid JSON in products file: {str(e)}")
    except Exception as e:
        logger.error(f"Error reading products: {e}")
        raise RuntimeError(f"Failed to read products: {str(e)}")

def write_products(data: list) -> None:
    try:
        PRODUCTS_PATH.write_text(json.dumps(data, indent=2))
        logger.info(f"Successfully wrote to {PRODUCTS_PATH}")
    except Exception as e:
        logger.error(f"Error writing to products: {e}")
        raise RuntimeError(f"Failed to write products: {str(e)}")

def validate_payload(data: dict, required_fields: set) -> tuple[bool, str]:
    """Validate that required fields are present in the payload."""
    missing = required_fields - set(data.keys())
    if missing:
        return False, f"Missing required fields: {', '.join(missing)}"
    return True, ""

def handle_catalog_create(payload: dict) -> dict:
    required_fields = {'productName', 'description', 'features', 'specs'}
    is_valid, error = validate_payload(payload, required_fields)
    if not is_valid:
        return {'success': False, 'error': error}, 400

    try:
        content = read_catalog()
        new_section = (
            f"## {payload['productName']} - Description\n"
            f"Description: {payload['description']}\n"
            f"Key Features:\n" + '\n'.join(f"- {f}" for f in payload['features']) + "\n"
            f"Technical Specifications:\n" + '\n'.join(f"- {s}" for s in payload['specs']) + "\n"
        )
        content += new_section
        write_catalog(content)
        return {'success': True}
    except Exception as e:
        return {'success': False, 'error': str(e)}, 500

def handle_catalog_update(payload: dict) -> dict:
    required_fields = {'productName', 'description', 'features', 'specs'}
    is_valid, error = validate_payload(payload, required_fields)
    if not is_valid:
        return {'success': False, 'error': error}, 400

    try:
        content = read_catalog()
        sections = content.split('## ') if content else []
        product_name = payload['productName']
        updated_section = (
            f"{product_name} - Description\n"
            f"Description: {payload['description']}\n"
            f"Key Features:\n" + '\n'.join(f"- {f}" for f in payload['features']) + "\n"
            f"Technical Specifications:\n" + '\n'.join(f"- {s}" for s in payload['specs']) + "\n"
        )

        for i, section in enumerate(sections):
            if section.startswith(product_name):
                sections[i] = updated_section
                break
        else:
            logger.error(f"Product not found in catalog: {product_name}")
            return {'success': False, 'error': f"Product '{product_name}' not found"}, 404

        write_catalog('## ' + '## '.join(s.strip() for s in sections if s.strip()))
        return {'success': True}
    except Exception as e:
        return {'success': False, 'error': str(e)}, 500

def handle_catalog_delete(payload: dict) -> dict:
    required_fields = {'productName'}
    is_valid, error = validate_payload(payload, required_fields)
    if not is_valid:
        return {'success': False, 'error': error}, 400

    try:
        content = read_catalog()
        sections = content.split('## ') if content else []
        product_name = payload['productName']
        original_count = len(sections)
        sections = [s for s in sections if not s.startswith(product_name)]
        
        if len(sections) == original_count:
            logger.error(f"Product not found in catalog: {product_name}")
            return {'success': False, 'error': f"Product '{product_name}' not found"}, 404

        write_catalog('## ' + '## '.join(s.strip() for s in sections if s.strip()))
        return {'success': True}
    except Exception as e:
        return {'success': False, 'error': str(e)}, 500

def handle_products_create(payload: dict) -> dict:
    required_fields = {'name', 'subtitle', 'price', 'specs'}
    is_valid, error = validate_payload(payload, required_fields)
    if not is_valid:
        return {'success': False, 'error': error}, 400

    try:
        products = read_products()
        products.append(payload)
        write_products(products)
        return {'success': True}
    except Exception as e:
        return {'success': False, 'error': str(e)}, 500

def handle_products_update(payload: dict) -> dict:
    required_fields = {'name', 'subtitle', 'price', 'specs'}
    is_valid, error = validate_payload(payload, required_fields)
    if not is_valid:
        return {'success': False, 'error': error}, 400

    try:
        products = read_products()
        for p in products:
            if p['name'] == payload['name']:
                p.update(payload)
                break
        else:
            logger.error(f"Product not found: {payload['name']}")
            return {'success': False, 'error': f"Product '{payload['name']}' not found"}, 404
        write_products(products)
        return {'success': True}
    except Exception as e:
        return {'success': False, 'error': str(e)}, 500

def handle_products_delete(payload: dict) -> dict:
    required_fields = {'productName'}
    is_valid, error = validate_payload(payload, required_fields)
    if not is_valid:
        return {'success': False, 'error': error}, 400

    try:
        products = read_products()
        product_name = payload['productName']
        original_count = len(products)
        products = [p for p in products if p['name'] != product_name]
        
        if len(products) == original_count:
            logger.error(f"Product not found: {product_name}")
            return {'success': False, 'error': f"Product '{product_name}' not found"}, 404

        write_products(products)
        return {'success': True}
    except Exception as e:
        return {'success': False, 'error': str(e)}, 500

@app.route('/api/crud', methods=['POST'])
def crud():
    logger.debug(f"Received CRUD request: {request.json}")
    if not request.is_json:
        logger.error("No JSON data in request")
        return jsonify({'success': False, 'error': 'No JSON data provided'}), 400

    data = request.json
    action = data.get('action')
    target = data.get('target')
    payload = data.get('data')

    if not all([action, target, payload]):
        logger.error(f"Invalid request: action={action}, target={target}, payload={payload}")
        return jsonify({'success': False, 'error': 'Missing action, target, or data'}), 400

    if target == 'catalog':
        if action == 'create':
            return jsonify(handle_catalog_create(payload))
        elif action == 'update':
            return jsonify(handle_catalog_update(payload))
        elif action == 'delete':
            return jsonify(handle_catalog_delete(payload))
    elif target == 'products':
        if action == 'create':
            return jsonify(handle_products_create(payload))
        elif action == 'update':
            return jsonify(handle_products_update(payload))
        elif action == 'delete':
            return jsonify(handle_products_delete(payload))

    logger.error(f"Invalid action or target: action={action}, target={target}")
    return jsonify({'success': False, 'error': 'Invalid action or target'}), 400

@app.route('/api/catalog', methods=['GET'])
def get_catalog():
    try:
        content = read_catalog()
        logger.debug(f"Serving catalog content: {content[:100]}...")
        return jsonify({'success': True, 'content': content})
    except Exception as e:
        logger.error(f"Error serving catalog: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/products', methods=['GET'])
def get_products():
    try:
        products = read_products()
        logger.debug(f"Serving products: {len(products)} items")
        return jsonify({'success': True, 'data': products})
    except Exception as e:
        logger.error(f"Error serving products: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

if __name__ == '__main__':
    app.run(port=5000, debug=True)