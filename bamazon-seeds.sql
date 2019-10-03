USE bamazon_db;

INSERT INTO products (product_name, department_name, price, stock_quantity)
VALUES ('Bag of Avacodos', 'Grocery', 10.49, 20);

INSERT INTO products (product_name, department_name, price, stock_quantity)
VALUES ('Fun Size Skittles', 'Grocery', 1.99, 100);

INSERT INTO products (product_name, department_name, price, stock_quantity)
VALUES ('Mayonaisse', 'Grocery', 3.99, 20);

INSERT INTO products (product_name, department_name, price, stock_quantity)
VALUES ('Watermelon', 'Grocery', 5.99, 30);

INSERT INTO products (product_name, department_name, price, stock_quantity)
VALUES ('Cheetos', 'Grocery', 2.99, 20);

INSERT INTO products (product_name, department_name, price, stock_quantity)
VALUES ('Digital Camera', 'Electronics', 199.99, 5);

INSERT INTO products (product_name, department_name, price, stock_quantity)
VALUES ('Nintento Switch Joycon', 'Electronics', 79.99, 10);

INSERT INTO products (product_name, department_name, price, stock_quantity)
VALUES ('Paper Towels', 'Home', 9.99, 15);

INSERT INTO products (product_name, department_name, price, stock_quantity)
VALUES ('Toilet Paper', 'Home', 19.99, 10);

INSERT INTO products (product_name, department_name, price, stock_quantity)
VALUES ('Toothpaste', 'Home', 2.49, 10);

INSERT INTO departments (department_name, over_head_costs)
VALUES ('Grocery', 10000);

INSERT INTO departments (department_name, over_head_costs)
VALUES ('Electronics', 5000);

INSERT INTO departments (department_name, over_head_costs)
VALUES ('Home', 7500);