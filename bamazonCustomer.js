// Import requied Node.js packages
var mysql = require('mysql');
var inquirer = require('inquirer');

// Create connection info our MySQL database
var connection = mysql.createConnection({
    host: "localhost",
    port: 3306,
    user: "root",
    password: "password",
    database: "bamazon_db"
});

// Create the connection to our database
connection.connect(function(err) {
    if (err) throw err;
    console.log("connected as id " + connection.threadId);

    // Load the main menu once the connection has been made
    // (this is the starting point of our app)
    mainMenu();
});

// Loads the main menu display
function mainMenu () {

    // Create a prompt that prompts the customer for what they would like to do
    inquirer.prompt([
        {
            type: 'rawlist',
            message: 'What would you like to do?',
            choices: [
                'Purchase a product',
                'Quit',
            ],
            name: 'menuChoice'
        }
    ])
    .then(function (answers) {

        switch(answers.menuChoice) {
            case 'Purchase a product': displayProducts(); break;

            // Close the connection if Quit or any other unidentified menu choice is chosen
            default: connection.end();
        }
    });
}

// Displays the products for sale and then asks the user what product they'd likie to purchase
function displayProducts () {

    // Create a query that selects all the products from the database and displays them
    connection.query(
        'SELECT * FROM products',
        function (err, res) {
            if (err) throw err;

            // Display all of the items (without showing the products' sales)
            console.table(res, ['item_id','product_name','department_name','price','stock_quantity']);

            // Prompt the customer to select a product to purchase
            chooseProduct(res);
        }
    );
}

// Loads menu for asking the customer what product they'd like to buy 
function chooseProduct (products) {

    // Create an object of products accessible by item IDs
    // For access time of amortized constant complexity (and space of n)
    var productsById = {};
    products.forEach(function (item) {
        productsById[item.item_id] = {
            name: item.product_name,
            price: item.price,
            quantity: item.stock_quantity,
            sales: item.product_sales,
        };
    });

    // Create a prompt asking the customer what product they'd like to buy
    inquirer.prompt([
        {
            message: 'What is the Item ID of the product you would like to purchase?',
            name: 'productID',
            validate: function (input) {
                // If we're a number
                if (!isNaN(input)) {
                    // If we exist as a product
                    if (productsById.hasOwnProperty(parseInt(input))) {
                        // Return valid
                        return true;
                    }
                    // Return invalid message
                    return 'That Item ID does not exist! Please correct!';
                }
                // Return invalid message
                return 'That is not a valid Item ID! Expecting a number!';
            }
        },
        {
            message: 'How many units would you like to purchase?',
            name: 'numberOfUnits',
            validate: function (input, answers) {
                // If we're a number
                if (!isNaN(input)) {
                    // Grab our product's available quantity
                    var currentMax = productsById[parseInt(answers.productID)].quantity;

                    // If the customer wants an available quantity
                    if (parseInt(input) <= currentMax) {
                        // Return valid
                        return true;
                    }
                    // Return invalid message
                    return 'There is not enough stock to sell that much! Please enter a lower number.';
                }
                // Return invalid message
                return 'That is not a valid amount! Expecting a number!';
            }
        }
    ])
    .then(function (answers) {

        // Purchase the product selected by the customer
        purchaseProducts(
            productsById[parseInt(answers.productID)].name,
            parseInt(answers.productID),
            productsById[parseInt(answers.productID)].price,
            productsById[parseInt(answers.productID)].sales,
            parseInt(answers.numberOfUnits),
            productsById[parseInt(answers.productID)].quantity
        );
    });
}

// Starts the purchase of the product and displays the result
function purchaseProducts (name, productID, price, sales, quantity, maxQuantity) {

    // Update the relevant info in the database
    updateProduct(
        productID,
        {
            stock_quantity: maxQuantity - quantity,
            product_sales: sales + (price * quantity)
        },
        function () {
            // Display the purchase results to the customer
            console.log(`\nPurchased ${quantity} unit${(quantity!==1)?'s':''} of ${name} for $${(price * quantity).toFixed(2)}!\n`);

            // Go back to the main menu
            mainMenu();
        }
    );
}

// Updates the given info in the database and then calls the callback upon completion
function updateProduct (productID, updatedProperties, completedCallback) {

    // Create a SQL query that updates a product's info in the products table
    connection.query(
        "UPDATE products SET ? WHERE ?",
        [
            updatedProperties,
            { item_id: productID }
        ],
        function(err, res) {
          if (err) throw err;

          // Call the supplied callback function
          completedCallback();
        }
    );
}