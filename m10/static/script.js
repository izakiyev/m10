document.addEventListener('DOMContentLoaded', function() {
    const video = document.getElementById('scanner-video');
    const productName = document.getElementById('product-name');
    const productBarcode = document.getElementById('product-barcode');
    const productPrice = document.getElementById('product-price');
    const barcodeForm = document.getElementById('barcode-form');
    const addToCartButton = document.getElementById('add-to-cart');
    const shoppingCart = document.getElementById('shopping-cart');
    const quantityInput = document.getElementById('quantity');
    const totalAmountInput = document.getElementById('total-input');
    const totalAmountDisplay = document.getElementById('total-amount');
    const payButton = document.getElementById('pay-button');

    let cartItems = [];

    // Access the camera and start streaming
    navigator.mediaDevices.getUserMedia({ video: true })
        .then(function(stream) {
            video.srcObject = stream;
            video.onloadedmetadata = function(e) {
                video.play();
            };
        })
        .catch(function(err) {
            console.log("Error accessing camera:", err);
        });

    // Initialize QuaggaJS for barcode scanning
    Quagga.init({
        inputStream: {
            name: "Live",
            type: "LiveStream",
            target: video,
            constraints: {
                width: 480,
                height: 320,
                facingMode: "environment"
            },
        },
        decoder: {
            readers: ["ean_reader", "upc_reader", "code_128_reader", "code_39_reader"],
        },
    }, function(err) {
        if (err) {
            console.error("Error initializing QuaggaJS:", err);
            return;
        }
        console.log("QuaggaJS initialization succeeded.");
        Quagga.start();
    });

    // Handle barcode detection
    Quagga.onDetected(function(result) {
        const barcode = result.codeResult.code;
        console.log("Barcode detected:", barcode);
        fetchProductDetails(barcode);
    });

    // Handle form submission
    barcodeForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const barcodeInput = document.getElementById('barcode-input').value;
        fetchProductDetails(barcodeInput);
    });

    // Function to fetch product details from Django backend API
    function fetchProductDetails(barcode) {
        fetch(`/api/product/${barcode}/`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Product not found');
                }
                return response.json();
            })
            .then(data => {
                // Display product details
                productName.textContent = data.name;
                productBarcode.textContent = data.barcode;
                productPrice.textContent = `$${data.price}`;
                quantityInput.value = '1'; // Set quantity to 1

                // Show product details section
                document.querySelector('.product-details').classList.add('active');
            })
            .catch(error => {
                // Handle errors or product not found
                console.error('Error fetching product details:', error);
                productName.textContent = 'Product not found';
                productBarcode.textContent = '';
                productPrice.textContent = '';
                quantityInput.value = ''; // Clear quantity input

                // Hide product details section
                document.querySelector('.product-details').classList.remove('active');
            });
    }

    // Handle adding product to cart
    addToCartButton.addEventListener('click', function() {
        const name = productName.textContent;
        const barcode = productBarcode.textContent;
        const price = parseFloat(productPrice.textContent.replace('$', ''));
        const quantity = parseInt(quantityInput.value, 10);

        // Validate quantity
        if (isNaN(quantity) || quantity <= 0) {
            alert('Please enter a valid quantity.');
            return;
        }

        // Calculate total price
        const totalPrice = (price * quantity).toFixed(2);

        // Add item to cart array
        const cartItem = {
            name: name,
            barcode: barcode,
            price: price,
            quantity: quantity,
            total: totalPrice
        };

        cartItems.push(cartItem);
        updateCartUI();

        // Clear product details and barcode input
        productName.textContent = '';
        productBarcode.textContent = '';
        productPrice.textContent = '';
        document.querySelector('.product-details').classList.remove('active');
        document.getElementById('barcode-input').value = '';
    });

    // Function to update cart UI
    function updateCartUI() {
        shoppingCart.innerHTML = ''; // Clear previous cart items

        cartItems.forEach(item => {
            const cartItemElement = document.createElement('li');
            cartItemElement.textContent = `${item.name} - Barcode: ${item.barcode} - Price: $${item.price} - Quantity: ${item.quantity} - Total: $${item.total}`;
            shoppingCart.appendChild(cartItemElement);
        });

        // Calculate total amount
        const totalAmount = cartItems.reduce((acc, item) => acc + parseFloat(item.total), 0).toFixed(2);
        totalAmountInput.value = totalAmount; // Update total amount input
        totalAmountDisplay.textContent = `Total Amount: $${totalAmount}`;
        // Enable pay button if there are items in the cart
        payButton.disabled = cartItems.length === 0;
    }

    // Handle pay button click
    payButton.addEventListener('click', function() {
        // Ensure total amount is non-zero and valid
        const totalAmount = parseFloat(totalAmountInput.value);
        if (isNaN(totalAmount) || totalAmount <= 0) {
            alert('Invalid total amount. Please check your cart.');
            return;
        }

        // Prepare cart items data to send to server
        const postData = {
            cart_items: cartItems,
            total_amount: totalAmount
        };

        // Send cart items data to server via AJAX
        fetch('/pay/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken') // Ensure to include CSRF token
            },
            body: JSON.stringify(postData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                window.location.href = data.redirect_url; // Redirect to success page
            } else {
                alert('Payment failed: ' + data.error);
            }
        })
        .catch(error => {
            console.error('Error during payment:', error);
            alert('An error occurred during payment. Please try again.');
        });
    });

    // Function to retrieve CSRF token cookie value
    function getCookie(name) {
        const cookieValue = document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)');
        return cookieValue ? cookieValue.pop() : '';
    }
});
