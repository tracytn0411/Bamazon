
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

connection.connect();

allProducts();

//Display all items available for sale
function allProducts() {
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

  connection.query('SELECT * FROM products', function(error, results, fields) {
    if (error) throw error;
    // Style and display results as a table
    var table = new Table({
      head: ['ID'.bold.yellow, 'Products'.bold.yellow, 'Price'.bold.yellow],
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
            console.log('\nPlease enter a valid id number.'.red)
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
            console.log('\nPlease enter a valid id number.\n'.red)
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

function inventoryCheck(itemID, itemQuantity) {
  connection.query('SELECT * FROM products WHERE item_id = ?', [itemID], function (error, results, fields) {
    if (error) throw error;
    if (results[0].stock_quantity === 0) {
      console.log("\n***Sorry! We are currently out of stock\n".magenta);
      buyDifferent();
    } else if (itemQuantity > results[0].stock_quantity) {
      console.log('\n***Sorry! We only have '.magenta + results[0].stock_quantity + ' ' + results[0].product_name +  ' in stock.\n'.magenta);
      orderPrompt();
    } else {
      console.log(colors.cyan('\n***You have added ' + itemQuantity + ' ' +  results[0].product_name + ' to your cart.\n'));
      var totalCost = itemQuantity * results[0].price; //set variable to use later
      buyProduct(itemID, itemQuantity, totalCost); //pass arguments to next function
    }
  })
}

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
        connection.query('UPDATE products SET stock_quantity = stock_quantity - ? WHERE item_id = ?', [itemQuantity, itemID], function(error, results, fields) {
          if (error) throw error;
          
          console.log(colors.green("\nThank you for your purchase"));
          console.log(colors.green('Your receipt is $' + totalCost + '\n'));
          buyDifferent();
        });
      } else {
        buyDifferent();
      }
    })
}

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
    })
}

function exit() {
  console.log(colors.blue('\n*****Thank you for visiting Bamazon. We hope to see you again soon!*****\n'));
  connection.end();
}


