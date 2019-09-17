DROP DATABASE IF EXISTS bamazon;
CREATE DATABASE bamazon;

USE bamazon;

CREATE TABLE products (
	item_id 		    INT	UNSIGNED 	NOT NULL	AUTO_INCREMENT, 
	product_name 	  VARCHAR(255)	NOT NULL,
	department_name VARCHAR(255) 	NOT NULL,
	price 			    DECIMAL(7,2)	NOT NULL,
	stock_quantity 	INT UNSIGNED 	NOT NULL 	DEFAULT 0,
	PRIMARY KEY 	  (item_id)
);

INSERT INTO products (product_name, department_name, price, stock_quantity)
VALUES 	('Apple Macbook Air', 'Laptops', 1500.75, 20),
		    ('Google Pixelbook', 'Laptops', 900.00, 40),
		    ('HP ZBook Studio', 'Laptops', 1600.00, 15),
		    ('Google Pixel 4', 'Smart Phones', 749.00, 30),
		    ('Apple Iphone 11', 'Smart Phones', 815.25, 25),
		    ('Samsung Galaxy S10', 'Smart Phones', 1200.00, 25),
		    ('Goole Pixel Watch', 'Fitness Trackers', 400.75, 20),
		    ('Fitbit Inspire HR', 'Fitness Trackers', 99.95, 50),
		    ('Nintendo Switch', 'Video Games', 299.99, 15),
		    ('PlayStation 4', 'Video Games', 275.25, 20),
		    ('XBox ONE', 'Video Games', 350.50, 15) ;