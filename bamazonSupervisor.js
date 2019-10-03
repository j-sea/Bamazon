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
                'View Product Sales by Department',
                'Create New Department',
                'Quit',
            ],
            name: 'menuChoice'
        }
    ])
    .then(function (answers) {

        switch(answers.menuChoice) {
            case 'View Product Sales by Department': viewProductSalesMenu(); break;
            case 'Create New Department': createNewDepartmentMenu(); break;
            case 'Quit': connection.end(); break;
        }
    });
}

function viewProductSalesMenu () {

    connection.query(
        'SELECT departments.department_id, departments.department_name, departments.over_head_costs, SUM(products.product_sales) AS product_sales, SUM(products.product_sales) - departments.over_head_costs AS total_profit FROM departments INNER JOIN products ON departments.department_name = products.department_name GROUP BY departments.department_name',
        function (err, res) {
            if (err) throw err;

            console.table(res);

            mainMenu();
        }
    )
}

function createNewDepartmentMenu () {

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
                    message: 'What is the Name of the department you would like to add?',
                    name: 'departmentName',
                    validate: function (input) {
                        if (!departmentNames.hasOwnProperty(input)) {
                            return true;
                        }
                        return 'That Department Name already exists! Please correct!';
                    }
                },
                {
                    message: 'What is the total overhead cost of this Department?',
                    name: 'overheadCost',
                    validate: function (input) {
                        if (!isNaN(input)) {
                            return true;
                        }
                        return 'That is not a valid number! Expected no characters or currency symbols.';
                    }
                },
            ])
            .then(function (answers) {
        
                addNewDepartment(
                    answers.departmentName,
                    answers.overheadCost
                );
            });
        }
    );
}

function addNewDepartment(departmentName, overheadCostTotal) {

    createDepartment(
        {
            'department_name': departmentName,
            'over_head_costs': parseFloat(overheadCostTotal),
        },
        function () {
            console.log(`\nAdded ${departmentName} with an overhead of $${parseFloat(overheadCostTotal)}!\n`);

            mainMenu();
        }
    )
}

function createDepartment (departmentProperties, completedCallback) {

    connection.query(
        "INSERT INTO departments SET ?",
        departmentProperties,
        function (err, res) {
            if (err) throw err;

            completedCallback();
        }
    )
}