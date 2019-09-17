
//dependencies
require('dotenv').config();
var inquirer = require('inquirer');
var Table = require('cli-table3');
var colors = require('colors');
var mysql = require('mysql');

//connect to mysql database
var connection = mysql.createConnection({
    host            : process.env.DB_HOST,
    user            : process.env.DB_USER ,
    password        : process.env.DB_PASSWORD ,
    database        : process.env.DB_DATABASE 
});

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

//function to display menu options for manager
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
          connection.end();
          break;
      }
    })
}

//function to show all available item 
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
  })
}

//function to show items with stock quantity lower than 5
function lowInventory() {
  connection.query('SELECT * FROM products WHERE stock_quantity < 20', function (error, results, fields){
    if (error) throw error;
    if (results.length === 0) {
      console.log('\n***There is not any item low in stock.'.blue);
      managerPrompt();
    } else {
      var lowInvTable = new Table({
        head: ['ID'.bold, 'Products'.bold, 'Departments'.bold, 'Price'.bold, 'Quantities'.bold],
        colWidths: [7, 30, 15]
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

//function to add to Inventory
function addInventory () {
  inquirer
    .prompt([
      {
        name: 'product_id',
        type: 'input',
        message: 'Please enter the id of item you would like to add inventory: ',
        validate: function (value) {
          if (value <=0 || isNaN(value)) {
            console.log('\nPlease enter a valid id number.'.red)
          } else {
            return true;
          }
        }
      },
      {
        name: "product_quantity",
        type: 'number',
        message: 'Please enter the quantity number you would like to add to inventory',
      }
    ])
    .then(function(answers){
      connection.query('UPDATE products SET stock_quantity = stock_quantity + ? WHERE item_id = ?', [answers.product_quantity,answers.product_id], function (error, results, fields) {
        if (error) throw error;
        console.log('\nNew inventory has been successfully updated\n'.blue);
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

//function to make sql query to add new product to database
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
        message: 'Cost per item ($): '
      },
      {
        name: 'product_quantity',
        type: 'input',
        message: 'Quantity: '
      }
    ])
    .then(function(answers) {
      connection.query('INSERT INTO products SET ?',
      {
        product_name: answers.product_name,
        department_name: answers.product_department,
        price: answers.product_price,
        stock_quantity: answers.product_quantity
      }, 
      function (error, results, fields) {
        if (error) throw error;
        console.log('\n' + answers.product_name + ' was successfully added.\n'.blue);
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

