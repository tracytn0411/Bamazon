
require('dotenv').config();
var inquirer = require('inquirer');
var Table = require('cli-table3');
var colors = require('colors');
var mysql = require('mysql');

var connection = mysql.createConnection({
    host            : process.env.DB_HOST,
    user            : process.env.DB_USER ,
    password        : process.env.DB_PASSWORD ,
    database        : process.env.DB_DATABASE 
});

//Display welcome banner and allProducts table after connecting to mysql
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
    colWidths: [54],
    style: {
      head: [], border: [],
    }
  });
  table.push(
    ['                 Welcome to BAMAZON']
  );
  console.log("\n" + table.toString());
  allProducts();
});

//Display all items available for sale
function allProducts() {
  connection.query('SELECT * FROM products', function(error, results, fields) {
    if (error) throw error;
    // Style and display results as a table
    var table = new Table({
      head: ['ID'.bold, 'Products'.bold, 'Price'.bold],
      colWidths: [7, 30, 15]
    });
    for (var i = 0; i < results.length; i++){
      table.push(
      [results[i].item_id, results[i].product_name.bold, colors.green('$ ' + results[i].price)]
      );
    }
    console.log(table.toString() + "\n");
    orderPrompt();
  })
}

function orderPrompt() {
  inquirer
    .prompt([
      {
        name: 'product_id',
        type: 'input',
        message: 'Please enter the id of the product you would like to purchase:',
        validate: function (value) {
          if (value <= 0 || isNaN(value)) {
            return'Please enter a valid id number.'.red
          } else{
            return true;
          }
        }
      },
      {
        name: 'product_quantity',
        type: 'number',
        message: 'Please enter the quantiy of the product you would like to purchase:',
        validate: function (value) {
          if (value <= 0 || isNaN(value)) {
            return 'Please enter a valid number.'.red
          } else {
            return true;
          }
        }
      }
    ])
    .then(function(answer) {
      inventoryCheck(answer.product_id, answer.product_quantity); //arguments will be passed down
    }); 
}

//function request query to check for inventory and response
function inventoryCheck(itemID, itemQuantity) {
  connection.query('SELECT * FROM products WHERE item_id = ?', [itemID], function (error, results, fields) {
    if (error) throw error;
    if (results[0].stock_quantity === 0) {
      console.log("\n***Sorry! We are currently out of stock\n".magenta);
      buyDifferent();
    } else if (itemQuantity > results[0].stock_quantity) {
      console.log(colors.magenta('\n***Sorry! We only have ' + results[0].stock_quantity + ' ' + results[0].product_name +  ' in stock.\n'));
      buyDifferent();
    } else {
      console.log(colors.blue('\n***You have added ' + colors.underline(itemQuantity + ' ' + results[0].product_name) + ' to your cart.\n'));
      var totalCost = itemQuantity * results[0].price; //set variable to use later
      buyProduct(itemID, itemQuantity, totalCost); //pass arguments to next function
    }
  })
}

//function to confirm purchase and make query to update database 
function buyProduct(itemID, itemQuantity, totalCost) {
  inquirer
    .prompt([
      {
        name: 'checkout',
        type: 'confirm',
        message: 'Would you like to check out now?'
      }
    ])
    .then(function(answers){
      if (answers.checkout){
        connection.query('UPDATE products SET stock_quantity = stock_quantity - ?, product_sales = product_sales + ? WHERE item_id = ?', [itemQuantity, totalCost, itemID], function(error, results, fields) {
          if (error) throw error;
          console.log(colors.green("\nThank you for your purchase"));
          console.log(colors.green('Your receipt is $' + totalCost + '\n'));
          buyDifferent();
          });
      } else {
        buyDifferent();
      }
    }
  );
}

//Function to go back to allproducts() or exit
function buyDifferent(){
  inquirer
    .prompt([
      {
        name: 'differentItem',
        type: 'list',
        message: 'Would you like to browse for other products?',
        choices: ['Sure', 'No. I will come back later']
      }
    ])
    .then(function(answer){
      switch(answer.differentItem){
        case 'Sure':
          allProducts();
          break;
        case 'No. I will come back later':
          exit();
      }
    }
  );
}

function exit() {
  console.log(colors.cyan('\n*****THANK YOU FOR VISITING BAMAZON. WE HOPE TO SEE YOU AGAIN SOON.*****\n\n'));
  connection.end();
}


