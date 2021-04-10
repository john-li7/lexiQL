const { Pool } = require('pg');
/* Example db URI */
const EX_PG_URI =
  'postgres://zhocexop:Ipv9EKas6bU6z9ehDXZQRorjITIXijGv@ziggy.db.elephantsql.com:5432/zhocexop';
const fs = require('fs');
const sqlQuery = fs.readFileSync('server/tableQuery.sql', 'utf8');

const SQLController = {};

SQLController.getSQLSchema = (req, res, next) => {
  let PSQL_URI;
  req.body.link ? (PSQL_URI = req.body.link) : (PSQL_URI = EX_PG_URI);
  res.locals.PSQLURI = PSQL_URI;
  const db = new Pool({ connectionString: PSQL_URI });
  db.query(sqlQuery)
    .then((data) => {
      res.locals.SQLSchema = data.rows[0].tables;
      return next();
    })
    .catch((err) => {
      const errObj = {
        log: `Error in getSQLSchema: ${err}`,
        status: 400,
        message: {
          err: 'Unable to connect to SQL database, please confirm URI',
        },
      };
      return next(errObj);
    });
};

/* Format the SQL Schema for visualizer */
SQLController.formatGraphData = (req, res, next) => {
  try {
    const sqlSchema = res.locals.SQLSchema;
    let graphData = [];
    for (const tableName of Object.keys(sqlSchema)) {
      const tableObject = {};
      tableObject[tableName] = sqlSchema[tableName];
      if (sqlSchema[tableName].foreignKeys) {
        const foreignKeysArray = [];
        for (const fk of Object.keys(sqlSchema[tableName].foreignKeys)) {
          const foreignKeyObject = {};
          foreignKeyObject[fk] = sqlSchema[tableName].foreignKeys[fk];
          foreignKeysArray.push(foreignKeyObject);
        }
        sqlSchema[tableName].foreignKeys = foreignKeysArray;
      }

      if (sqlSchema[tableName].referencedBy) {
        const referencedByArray = [];
        for (const refBy of Object.keys(sqlSchema[tableName].referencedBy)) {
          const referencedByObject = {};
          referencedByObject[refBy] = sqlSchema[tableName].referencedBy[refBy];
          referencedByArray.push(referencedByObject);
        }
        sqlSchema[tableName].referencedBy = referencedByArray;
      }

      if (sqlSchema[tableName].columns) {
        const columnsArray = [];
        for (const columnName of Object.keys(sqlSchema[tableName].columns)) {
          const columnsObject = {};
          columnsObject[columnName] = sqlSchema[tableName].columns[columnName];
          columnsArray.push(columnsObject);
        }
        sqlSchema[tableName].columns = columnsArray;
      }

      graphData.push(tableObject);
    }
    res.locals.SQLSchema = graphData;
    return next();
  } catch (err) {
    const errObject = {
      log: `Error in formatGraphData: ${err}`,
      status: 400,
      message: { err: `Format graph data failed` },
    };
    return next(errObject);
  }
};
module.exports = SQLController;
