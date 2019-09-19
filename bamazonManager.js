//dependencies
require('dotenv').config();
var inquirer = require('inquirer');
var Table = require('cli-table3');
var colors = require('colors');
var mysql = require('mysql');

//Connect to mysql database
var connection = mysql.createConnection({
    host            : process.env.DB_HOST,
    user            : process.env.DB_USER ,
    password        : process.env.DB_PASSWORD ,
    database        : process.env.DB_DATABASE 
});

//Show Manager Portal banner after connecting to mysql
connection.connect(function(error){
  if (error) throw error;
  var table = new Table({
    chars: {
      'top': '═'
      , 'top-left': '╔'
      , 'top-right': '╗'
      , 'bottom': '═'
      , 'bottom-left': '╚'
      , 'bottom-right': '╝'
      , 'left': '║'
      , 'right': '║'
    },
    colWidths: [76],
    style: {
      head: [], border: [],
    }
  });
  table.push(
    ['                         BAMAZON - MANAGER PORTAL']
  );
  console.log("\n" + table.toString() + "\n");
  managerPrompt();
});

//Function to display menu options for manager
function managerPrompt (){
  inquirer
    .prompt([
      {
        type: "list",
        message: "Please select an option:",
        choices: ["View Products for Sale", "View Low Inventory", "Add to Inventory", "Add New Product", "Exit"],
        name: "menu"
      }
    ]).then(function(answers){
      switch (answers.menu) {
        case "View Products for Sale":
          allProducts();
          break;
        case "View Low Inventory":
          lowInventory();
          break;
        case "Add to Inventory":
          addInventory();
          break;
        case "Add New Product":
          addProduct();
          break;
        case "Exit":
          exit();
          break;
      }
    })
}

//Function to show all available item 
function allProducts() {
  connection.query('SELECT * FROM products', function(error, results, fields) {
    if (error) throw error;
    // Style and display results as a table
    var table = new Table({
      head: ['ID'.bold, 'Products'.bold, 'Departments'.bold, 'Price'.bold, 'Quantity'.bold],
      colWidths: [5, 25, 19, 13, 10]
    });
    for (var i = 0; i < results.length; i++){
      table.push(
      [results[i].item_id, results[i].product_name.bold, results[i].department_name, colors.green('$ ' + results[i].price), colors.blue(results[i].stock_quantity)]
      );
    }
    console.log(table.toString() + "\n");
    managerPrompt();
  });
}

//Function to show items with stock quantity lower than 5 (use 20 for testing purpose)
function lowInventory() {
  connection.query('SELECT * FROM products WHERE stock_quantity < 20', function (error, results, fields){
    if (error) throw error;
    if (results.length === 0) {
      console.log('\n***There is not any item low in stock.'.blue);
      managerPrompt();
    } else {
      var lowInvTable = new Table({
        head: ['ID'.bold, 'Products'.bold, 'Departments'.bold, 'Price'.bold, 'Quantities'.bold],
        colWidths: [5, 25, 19, 13, 10]
      });
      for (var i = 0; i < results.length; i++){
        lowInvTable.push(
        [results[i].item_id, results[i].product_name.bold, results[i].department_name, colors.green('$ ' + results[i].price), colors.blue(results[i].stock_quantity)]
        );
      }
      console.log(lowInvTable.toString() + "\n");
      managerPrompt();
    }
  });
}

//Function to add to Inventory
function addInventory () {
  console.log('\nPlease fill out the information of new inventory.')
  inquirer
    .prompt([
      {
        name: 'product_id',
        type: 'input',
        message: 'Product ID: ',
        validate: function (value) {
          if (value <=0 || isNaN(value)) {
            return 'Please enter a valid id number.'.red
          } else {
            return true;
          }
        }
      },
      {
        name: "product_quantity",
        type: 'input',
        message: 'Quantity: ',
        validate: function (value) {
          if (value <=0 || isNaN(value)) {
            return 'Please enter a number.'.red
          } else {
            return true;
          }
        }
      }
    ])
    .then(function(answers){
      connection.query('UPDATE products SET stock_quantity = stock_quantity + ? WHERE item_id = ?', [answers.product_quantity,answers.product_id], function (error, results, fields) {
        if (error) throw error;
        console.log('\n*****New inventory has been successfully updated\n'.blue);
        inquirer
          .prompt([
            {
              name: 'more_inventory',
              type: 'confirm',
              message: 'Would you like to add more inventory?',
            }
          ])
          .then(function(answer){
            if (answer.more_inventory){
              addInventory()
            } else {
              managerPrompt()
            }
          });
        });
      });
    }

//Function to make sql query to add new product to database
function addProduct(){
  console.log('\nPlease fill out the information of new product.')
  inquirer
    .prompt([
      {
        name: 'product_name',
        type: 'input',
        message: 'Product name: ',
      },
      {
        name: 'product_department',
        type: 'input',
        message: 'Department: '
      },
      {
        name: 'product_price',
        type: 'input',
        message: 'Cost per item: ' + '$'.green,
        validate: function (value) {
          if (value <=0 || isNaN(value)) {
            return 'Please enter a number.'.red
          } else {
            return true;
          }
        }
      },
      {
        name: 'product_quantity',
        type: 'input',
        message: 'Quantity: ',
        validate: function (value) {
          if (value <=0 || isNaN(value)) {
            return 'Please enter a number.'.red
          } else {
            return true;
          }
        }
      }
    ])
    .then(function(answers) {
      connection.query('INSERT INTO products SET ?', //skip item_id cuz it's auto-increment
      {
        product_name: answers.product_name,
        department_name: answers.product_department,
        price: answers.product_price,
        stock_quantity: answers.product_quantity
      }, 
      function (error, results, fields) {
        if (error) throw error;
        console.log(colors.blue('\n*****' + answers.product_name.underline + ' has been successfully added.\n'));
        inquirer
        .prompt([
          {
            name: 'more_product',
            type: 'confirm',
            message: 'Would you like to add another product?'
          }
        ])
        .then(function(answer){
          if (answer.more_product){
            addProduct();
          } else {
            managerPrompt();
          }
        });
      });
    });
  }

function exit() {
  console.log(colors.cyan(
    '\n******************************SESSION ENDED******************************\n\n'));
  connection.end();
}