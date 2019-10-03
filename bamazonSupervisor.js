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

    // Create a prompt that prompts the supervisor for what they would like to do
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
            case 'View Product Sales by Department': viewProductSales(); break;
            case 'Create New Department': createNewDepartmentMenu(); break;

            // Close the connection if Quit or any other unidentified menu choice is chosen
            default: connection.end();
        }
    });
}

function viewProductSales () {

    // Create a SQL select query to display product sales
    connection.query(
        ['SELECT',
            'departments.department_id,',
            'departments.department_name,',
            'departments.over_head_costs,',
            'SUM(products.product_sales) AS product_sales,',
            'SUM(products.product_sales) - departments.over_head_costs AS total_profit',
        'FROM departments',
        'LEFT JOIN products',
        'ON departments.department_name = products.department_name',
        'GROUP BY departments.department_name'].join(' '),
        function (err, res) {
            if (err) throw err;

            // Display the department info in a nice table format
            console.table(res);

            // Display the main menu
            mainMenu();
        }
    )
}

// Displays the departments and prompts to add a new one
function createNewDepartmentMenu () {

    // Runs a SQL select query to display the existing departments
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

            // Create a prompt to determine the details of the department to add
            inquirer.prompt([
                {
                    message: 'What is the Name of the department you would like to add?',
                    name: 'departmentName',
                    validate: function (input) {
                        // If the department name doesn't already exist
                        if (!departmentNames.hasOwnProperty(input)) {
                            // Return valid
                            return true;
                        }
                        // Return invalid message
                        return 'That Department Name already exists! Please correct!';
                    }
                },
                {
                    message: 'What is the total overhead cost of this Department?',
                    name: 'overheadCost',
                    validate: function (input) {
                        // If the input is a number
                        if (!isNaN(input)) {
                            // Return valid
                            return true;
                        }
                        // Return invalid message
                        return 'That is not a valid number! Expected no characters or currency symbols.';
                    }
                },
            ])
            .then(function (answers) {

                // Add a new department with the given info
                addNewDepartment(
                    answers.departmentName,
                    answers.overheadCost
                );
            });
        }
    );
}

// Add a new department with the info supplied
function addNewDepartment(departmentName, overheadCostTotal) {

    // Create the department with the given information and then call the callback
    createDepartment(
        {
            'department_name': departmentName,
            'over_head_costs': parseFloat(overheadCostTotal),
        },
        function () {
            // Display the department addition results
            console.log(`\nAdded ${departmentName} with an overhead of $${parseFloat(overheadCostTotal)}!\n`);

            // Display the main menu
            mainMenu();
        }
    )
}

// Create a department in the departments table with the given info
function createDepartment (departmentProperties, completedCallback) {

    // Create a SQL insert query to add a department into the departments table
    connection.query(
        "INSERT INTO departments SET ?",
        departmentProperties,
        function (err, res) {
            if (err) throw err;

            // Call the call back upon completion of the insertion
            completedCallback();
        }
    )
}