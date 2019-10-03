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
                'Purchase a product',
                'Quit',
            ],
            name: 'menuChoice'
        }
    ])
    .then(function (answers) {

        switch(answers.menuChoice) {
            case 'Purchase a product': displayProducts(); break;
            default: connection.end();
        }
    });
}

function displayProducts () {

    connection.query(
        'SELECT * FROM products',
        function (err, res) {
            if (err) throw err;

            console.table(res, ['item_id','product_name','department_name','price','stock_quantity']);
            chooseProduct(res);
        }
    );
}

function chooseProduct (products) {

    var productsById = {};
    products.forEach(function (item) {
        productsById[item.item_id] = {
            name: item.product_name,
            price: item.price,
            quantity: item.stock_quantity,
            sales: item.product_sales,
        };
    });

    inquirer.prompt([
        {
            message: 'What is the Item ID of the product you would like to purchase?',
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
            message: 'How many units would you like to purchase?',
            name: 'numberOfUnits',
            validate: function (input, answers) {
                if (!isNaN(input)) {
                    var currentMax = productsById[parseInt(answers.productID)].quantity;
                    if (parseInt(input) <= currentMax) {
                        return true;
                    }
                    return 'There is not enough stock to sell that much! Please enter a lower number.';
                }
                return 'That is not a valid amount! Expecting a number!';
            }
        }
    ])
    .then(function (answers) {

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

function purchaseProducts (name, productID, price, sales, quantity, maxQuantity) {

    updateProduct(
        productID,
        {
            stock_quantity: maxQuantity - quantity,
            product_sales: sales + (price * quantity)
        },
        function () {
            console.log(`\nPurchased ${quantity} unit${(quantity!==1)?'s':''} of ${name} for $${(price * quantity).toFixed(2)}!\n`);

            mainMenu();
        }
    );
}

function updateProduct (productID, updatedProperties, completedCallback) {

    connection.query(
        "UPDATE products SET ? WHERE ?",
        [
            updatedProperties,
            { item_id: productID }
        ],
        function(err, res) {
          if (err) throw err;

          completedCallback();
        }
    );
}