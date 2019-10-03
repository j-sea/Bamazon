// Import requied Node.js packages
var mysql = require('mysql');
var inquirer = require('inquirer');

// Create connection info our MySQL database
var connection = mysql.createConnection(require('./mysqlSettings'));

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

    // Create a prompt that prompts the manager for what they would like to do
    inquirer.prompt([
        {
            type: 'rawlist',
            message: 'What would you like to do?',
            choices: [
                'View Products for Sale',
                'View Low Inventory',
                'Add to Inventory',
                'Add New Product',
                'Quit',
            ],
            name: 'menuChoice'
        }
    ])
    .then(function (answers) {

        switch(answers.menuChoice) {
            case 'View Products for Sale': viewProducts(); break;
            case 'View Low Inventory': viewLowInventory(); break;
            case 'Add to Inventory': addMoreMenu(); break;
            case 'Add New Product': addNewProductMenu(); break;

            // Close the connection if Quit or any other unidentified menu choice is chosen
            default: connection.end();
        }
    });
}

// Display all the products to the manager
function viewProducts () {

    // Create a SQL select query to grab all the rows from the products table
    connection.query(
        'SELECT * FROM products',
        function (err, res) {
            if (err) throw err;

            // Display the products in a nice table format
            console.table(res);

            // Display the main menu
            mainMenu();
        }
    );
}

// Display all products with a quantity less than 5 ot the manager
function viewLowInventory () {

    // Create a SQL select query to grab all products with less than 5 quantity
    connection.query(
        'SELECT * FROM products WHERE stock_quantity < 5',
        function (err, res) {
            if (err) throw err;

            // If we have found products
            if (res.length !== 0) {
                // Display the products in a nice table format
                console.table(res);
            }
            // If we haven't found products
            else {
                // Display that we haven't found any products that are low in inventory
                console.log('\nNo products have a stock quantity of less than 5!\n');
            }

            // Display the main menu
            mainMenu();
        }
    );
}

// Display a menu to add more inventory to a product
function addMoreMenu () {

    // Create a SQL select query to grab all products
    connection.query(
        'SELECT * FROM products',
        function (err, res) {
            if (err) throw err;

            // Display all the products in a nice table format
            console.table(res);

            // Create an object of products accessible by item IDs
            // For access time of amortized constant complexity (and space of n)
            var productsById = {};
            res.forEach(function (item) {
                productsById[item.item_id] = {
                    name: item.product_name,
                    price: item.price,
                    quantity: item.stock_quantity
                };
            });

            // Create a prompt for the manager to increase a product's quantity
            inquirer.prompt([
                {
                    message: 'What is the Item ID of the product you would like to increase the quantity of?',
                    name: 'productID',
                    validate: function (input) {
                        // If the given input is a number
                        if (!isNaN(input)) {
                            // If the given number is a valid product ID
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
                    message: 'How many units would you like to add?',
                    name: 'numberOfUnits',
                    validate: function (input, answers) {
                        // If the input is a number
                        if (!isNaN(input)) {
                            // If the number is not negative
                            if (parseInt(input) >= 0) {
                                // Return valid
                                return true;
                            }
                            // Return invalid message
                            return 'You cannot remove quantity from this menu!';
                        }
                        // Return invalid message
                        return 'That is not a valid amount! Expecting a number!';
                    }
                }
            ])
            .then(function (answers) {

                // Add the quantity given to the product's inventory
                addProductQuantities(
                    productsById[parseInt(answers.productID)].name,
                    parseInt(answers.productID),
                    parseInt(answers.numberOfUnits),
                    productsById[parseInt(answers.productID)].quantity
                );
            });
        }
    );
}

// Display a menu to add a new product
function addNewProductMenu () {

    // Create a SQL select query to display all the existing products
    connection.query(
        'SELECT * FROM products',
        function (err, res) {
            if (err) throw err;

            // Display products in a nice table format
            console.table(res);

            // Create an object of keys mapped to product Names
            // For access time of amortized constant complexity (and space of n)
            var productNames = {};
            res.forEach(function (item) {
                productNames[item.product_name] = undefined;
            });

            // Create a SQL select query to grab all departments
            connection.query(
                'SELECT * FROM departments',
                function (err, res) {
                    if (err) throw err;

                    // Create an object of keys mapped to department Names
                    // For access time of amortized constant complexity (and space of n)
                    var departmentNames = {};
                    res.forEach(function (item) {
                        departmentNames[item.department_name] = undefined;
                    });

                    // Create a prompt to 
                    inquirer.prompt([
                        {
                            message: 'What is the Name of the product you would like to add?',
                            name: 'productName',
                            validate: function (input) {
                                // If the product doesn't exist already
                                if (!productNames.hasOwnProperty(input)) {
                                    // Return valid
                                    return true;
                                }
                                // Return invalid message
                                return 'That Product Name already exists! Please correct! (Maybe you meant to use "Add to Inventory" instead?)';
                            }
                        },
                        {
                            message: 'What is the Department Name this product is stocked in?',
                            name: 'departmentName',
                            validate: function (input) {
                                // If the department name exists
                                if (departmentNames.hasOwnProperty(input)) {
                                    // Return valid
                                    return true;
                                }
                                // Return invalid message
                                return 'That Department does not exist! Please correct!';
                            }
                        },
                        {
                            message: 'What is the Price of this product?',
                            name: 'price',
                            validate: function (input) {
                                // If the input is a number
                                if (!isNaN(input)) {
                                    // If the number is not negative
                                    if (parseFloat(input) >= 0) {
                                        // Return valid
                                        return true;
                                    }
                                    // Return invalid message
                                    return 'The price should not be negative!';
                                }
                                // Return invalid message
                                return 'This is not a number! Expected just a number and no currency symbol.'
                            }
                        },
                        {
                            message: 'What Quantity would you like to add for this product?',
                            name: 'stockQuantity',
                            validate: function (input) {
                                // If the input is a number
                                if (!isNaN(input)) {
                                    // If the number is not negative
                                    if (parseInt(input) >= 0) {
                                        // Return valid
                                        return true;
                                    }
                                    // Return invalid message
                                    return 'The quantity should not be negative!';
                                }
                                // Return invalid message
                                return 'This is not a number! Please correct.'
                            }
                        },
                    ])
                    .then(function (answers) {

                        // Add the new product to the database
                        addNewProduct(
                            answers.productName,
                            answers.departmentName,
                            parseFloat(answers.price),
                            parseInt(answers.stockQuantity)
                        );
                    });
                }
            );
        }
    );
}

// Starts the addition of the quantity to the product and displays the result
function addProductQuantities(name, productID, quantity, currentQuantity) {

    // Update the relevant info in the database
    updateProduct(
        productID,
        {
            stock_quantity: currentQuantity + quantity
        },
        function () {
            // Display the addition results to the customer
            console.log(`\nAdded ${quantity} unit${(quantity!==1)?'s':''} of ${name}! There are now ${currentQuantity + quantity}!\n`);

            // Go back to the main menu
            mainMenu();
        }
    );
}

// Add the new product to the database
function addNewProduct(productName, departmentName, price, quantity) {

    // Create the new product in the database with the given info
    createProduct(
        {
            'product_name': productName,
            'department_name': departmentName,
            'price': price,
            'stock_quantity': quantity,
        },
        function () {
            // Display the creation results
            console.log(`\nAdded ${quantity} stock of ${productName} to ${departmentName} for ${price} each!\n`);

            // Display the main menu
            mainMenu();
        }
    )
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
        function (err, res) {
          if (err) throw err;

          // Call the supplied callback function
          completedCallback();
        }
    );
}

// Creates the given info in the database and then calls the callback upon completion
function createProduct (productProperties, completedCallback) {

    // Create a SQL query that creates a product in the products table
    connection.query(
        "INSERT INTO products SET ?",
        productProperties,
        function (err, res) {
            if (err) throw err;

            // Call the supplied callback function
            completedCallback();
        }
    )
}