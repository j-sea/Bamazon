var mysql = require('mysql');
var inquirer = require('inquirer');

var connection = mysql.createConnection({
    host: "localhost",
    port: 3306,
    user: "root",
    password: "password",
    database: "bamazon_db"
});

connection.connect(function(err) {
    if (err) throw err;
    console.log("connected as id " + connection.threadId);

    mainMenu();
});

function mainMenu () {

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
            case 'View Products for Sale': viewProductsMenu(); break;
            case 'View Low Inventory': viewLowInventoryMenu(); break;
            case 'Add to Inventory': addMoreMenu(); break;
            case 'Add New Product': addNewProductMenu(); break;
            case 'Quit': connection.end(); break;
        }
    });
}

function viewProductsMenu () {

    connection.query(
        'SELECT * FROM products',
        function (err, res) {
            if (err) throw err;

            console.table(res);

            mainMenu();
        }
    );
}

function viewLowInventoryMenu () {

    connection.query(
        'SELECT * FROM products WHERE stock_quantity < 5',
        function (err, res) {
            if (err) throw err;

            if (res.length !== 0) {
                console.table(res);
            }
            else {
                console.log('\nNo products have a stock quantity of less than 5!\n');
            }

            mainMenu();
        }
    );
}

function addMoreMenu () {

    connection.query(
        'SELECT * FROM products',
        function (err, res) {
            if (err) throw err;

            console.table(res);

            var productsById = {};
            res.forEach(function (item) {
                productsById[item.item_id] = {
                    name: item.product_name,
                    price: item.price,
                    quantity: item.stock_quantity
                };
            });

            inquirer.prompt([
                {
                    message: 'What is the Item ID of the product you would like to increase the quantity of?',
                    name: 'productID',
                    validate: function (input) {
                        if (!isNaN(input)) {
                            if (productsById.hasOwnProperty(parseInt(input))) {
                                return true;
                            }
                            return 'That Item ID does not exist! Please correct!';
                        }
                        return 'That is not a valid Item ID! Expecting a number!';
                    }
                },
                {
                    message: 'How many units would you like to add?',
                    name: 'numberOfUnits',
                    validate: function (input, answers) {
                        if (!isNaN(input)) {
                            if (parseInt(input) >= 0) {
                                return true;
                            }
                            return 'You cannot remove quantity from this menu!';
                        }
                        return 'That is not a valid amount! Expecting a number!';
                    }
                }
            ])
            .then(function (answers) {
        
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

function addNewProductMenu () {

    connection.query(
        'SELECT * FROM products',
        function (err, res) {
            if (err) throw err;

            console.table(res);

            var productNames = {};
            res.forEach(function (item) {
                productNames[item.product_name] = undefined;
            });

            connection.query(
                'SELECT * FROM departments',
                function (err, res) {
                    if (err) throw err;

                    var departmentNames = {};
                    res.forEach(function (item) {
                        departmentNames[item.department_name] = undefined;
                    });

                    inquirer.prompt([
                        {
                            message: 'What is the Name of the product you would like to add?',
                            name: 'productName',
                            validate: function (input) {
                                if (!productNames.hasOwnProperty(input)) {
                                    return true;
                                }
                                return 'That Product Name already exists! Please correct! (Maybe you meant to use "Add to Inventory" instead?)';
                            }
                        },
                        {
                            message: 'What is the Department Name this product is stocked in?',
                            name: 'departmentName',
                            validate: function (input) {
                                if (departmentNames.hasOwnProperty(input)) {
                                    return true;
                                }
                                return 'That Department does not exist! Please correct!';
                            }
                        },
                        {
                            message: 'What is the Price of this product?',
                            name: 'price',
                            validate: function (input) {
                                if (!isNaN(input)) {
                                    if (parseFloat(input) >= 0) {
                                        return true;
                                    }
                                    else {
                                        return 'The price should not be negative!';
                                    }
                                }
                                else {
                                    return 'This is not a number! Expected just a number and no currency symbol.'
                                }
                            }
                        },
                        {
                            message: 'What Quantity would you like to add for this product?',
                            name: 'stockQuantity',
                            validate: function (input) {
                                if (!isNaN(input)) {
                                    if (parseInt(input) >= 0) {
                                        return true;
                                    }
                                    else {
                                        return 'The quantity should not be negative!';
                                    }
                                }
                                else {
                                    return 'This is not a number! Please correct.'
                                }
                            }
                        },
                    ])
                    .then(function (answers) {
                
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

function addProductQuantities(name, productID, quantity, currentQuantity) {

    updateProduct(
        productID,
        {
            stock_quantity: currentQuantity + quantity
        },
        function () {
            console.log(`\nAdded ${quantity} unit${(quantity!==1)?'s':''} of ${name}! There are now ${currentQuantity + quantity}!\n`);
            
            mainMenu();
        }
    );
}

function addNewProduct(productName, departmentName, price, quantity) {

    createProduct(
        {
            'product_name': productName,
            'department_name': departmentName,
            'price': price,
            'stock_quantity': quantity,
        },
        function () {
            console.log(`\nAdded ${quantity} stock of ${productName} to ${departmentName} for ${price} each!\n`);

            mainMenu();
        }
    )
}

function updateProduct (productID, updatedProperties, completedCallback) {

    connection.query(
        "UPDATE products SET ? WHERE ?",
        [
            updatedProperties,
            { item_id: productID }
        ],
        function (err, res) {
          if (err) throw err;

          completedCallback();
        }
    );
}

function createProduct (productProperties, completedCallback) {

    connection.query(
        "INSERT INTO products SET ?",
        productProperties,
        function (err, res) {
            if (err) throw err;

            completedCallback();
        }
    )
}