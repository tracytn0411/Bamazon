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

//Show Supervisor Portal banner after connecting to mysql
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
    ['                       BAMAZON - SUPERVISOR PORTAL']
  );
  console.log("\n" + table.toString() + "\n");
  superPrompt();
});

//Function to display menu options for supervisor
function superPrompt() {
  inquirer
    .prompt([
      {
        name: "menu",
        type: 'list',
        message: "Please select an option:",
        choices: ["View Product Sales by Department", "Create New Department", "Exit"]
      }
    ])
    .then(function(answers){
      switch (answers.menu){
        case "View Product Sales by Department":
          allProducts ();
          break;
        case "Create New Department":
          addDepartment();
          break;
        case "Exit":
          exit();
          break;
      }
    })
}

//Function that make a query to display a custom table ('departments' LEFT JOIN 'products')
  //Subquery (alias products) first executes to take the sum of product_sales GROUP BY department_name
  //parent (outer) Query then calculates total_profit from product_sales passed from subquery
function allProducts() {
  connection.query(
    'SELECT departments.department_id AS id, departments.department_name AS departments, departments.over_head_cost AS over_head, products.product_sales AS sales, products.product_sales-departments.over_head_cost AS total_profit FROM departments LEFT JOIN (SELECT department_name, SUM(product_sales) AS product_sales FROM products GROUP BY department_name) products ON departments.department_name = products.department_name ORDER BY departments.department_id ASC', 
    function(error, results, fields){
      if (error) throw error;
      var table = new Table({
        head: ['ID'.bold, 'Departments'.bold, 'Over Head Cost'.bold, 'Product Sales'.bold, 'Total Profit'.bold],
        colWidths: [5, 22, 16, 15, 14]
      });
      for (var i = 0; i < results.length; i++){
        table.push(
        [results[i].id, results[i].departments, colors.green('$ ' + results[i].over_head), colors.green('$ ' + results[i].sales), colors.bold.green('$ ' + results[i].total_profit)]
        );
      }
      console.log(table.toString() + "\n");
      superPrompt();
    }
  );
} 

function addDepartment() {
  console.log('\nPlease fill out the indormation of new department.');
  inquirer
  .prompt([
    {
      name: 'department_name',
      type: 'input',
      message: 'Department name: '
    },
    {
      name: 'cost',
      type: 'input',
      message: 'Overhead Cost of New Department: ' + '$'.green,
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
    connection.query('INSERT INTO departments SET ?',
    {
      department_name: answers.department_name,
      over_head_cost: answers.cost
    },
    function (error, results, fields) {
      if (error) throw error;
      console.log(colors.blue('\n*****New department ' + answers.department_name.underline+ ' has been successully added.\n'));
      inquirer
      .prompt([
        {
          name: 'more_department',
          type: 'confirm',
          message: 'Would you like to add another department?'
        }
      ])
      .then(function(answer){
        if (answer.more_department){
          addDepartment();
        } else {
          superPrompt();
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
