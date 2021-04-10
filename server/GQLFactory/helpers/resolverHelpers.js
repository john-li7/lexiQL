const toCamelCase = require('camelcase');
const { singular } = require('pluralize');
const { pascalCase } = require('pascal-case');
const { isJunctionTable } = require('./helperFunctions');
const { Pool } = require('pg');
const resolverHelper = {};

/* */

resolverHelper.queryByPrimaryKey = (tableName, primaryKey, resolversObject) => {
  let queryName = '';
  if (tableName === singular(tableName)) {
    queryName += `${singular(tableName)}` + `ByID`;
  } else queryName = singular(tableName);

  const pool = new Pool({
    connectionString:
      'postgres://zhocexop:Ipv9EKas6bU6z9ehDXZQRorjITIXijGv@ziggy.db.elephantsql.com:5432/zhocexop',
  });

  const db = {};
  db.query = (text, params, callback) => {
    console.log('executed query:', text);
    return pool.query(text, params, callback);
  };

  // build resolversObject for makeExecutableSchema to generate GraphiQL playground
  const camelCaseQueryName = toCamelCase(queryName);
  resolversObject.Query[camelCaseQueryName] = (parent, args) => {
    const query = `SELECT * FROM ${tableName} WHERE ${primaryKey} = $1`;
    const values = [args[primaryKey]];
    return db
      .query(query, values)
      .then((data) => data.rows[0])
      .catch((err) => new Error(err));
  };

  // console.log(resolversObject.Query[queryName](null,1))

  return `
    ${toCamelCase(queryName)}: (parent, args) => {
      const query = 'SELECT * FROM ${tableName} WHERE ${primaryKey} = $1';
      const values = [args.${primaryKey}];
      return db.query(query, values)
        .then(data => data.rows[0])
        .catch(err => new Error(err));
    },`;
};

resolverHelper.queryAll = (tableName, resolversObject) => {
  // build resolversObject for makeExecutableSchema to generate GraphiQL playground
  const pool = new Pool({
    connectionString:
      'postgres://zhocexop:Ipv9EKas6bU6z9ehDXZQRorjITIXijGv@ziggy.db.elephantsql.com:5432/zhocexop',
  });

  const db = {};
  db.query = (text, params, callback) => {
    console.log('executed query:', text);
    return pool.query(text, params, callback);
  };

  const camelCaseTableName = toCamelCase(tableName);
  resolversObject.Query[camelCaseTableName] = () => {
    const query = `SELECT * FROM ${tableName}`;
    return db
      .query(query)
      .then((data) => data.rows)
      .then((data) => console.log('this is the data: ', data))
      .catch((err) => new Error(err));
  };
  // console.log(resolversObject.Query[tableName]());

  return `
    ${toCamelCase(tableName)}: () => {
      const query = 'SELECT * FROM ${tableName}';
      return db.query(query)
        .then(data => data.rows)
        .catch(err => new Error(err));
    },`;
};

/* */

resolverHelper.createMutation = (
  tableName,
  primaryKey,
  columns,
  resolversObject
) => {
  const mutationName = toCamelCase('add_' + singular(tableName));
  const columnsArray = Object.keys(columns).filter(
    (column) => column !== primaryKey
  );
  const columnsArgument = columnsArray.join(', ');
  const valuesArgument = columnsArray
    .map((column, i) => `$${i + 1}`)
    .join(', ');
  const valuesList = columnsArray.map((column) => `args.${column}`).join(', ');

  // build resolversObject for makeExecutableSchema to generate GraphiQL playground
  resolversObject.Mutation[mutationName] = (parent, args) => {
    const valuesListClean = columnsArray.map((column) => args[column]);

    const query = `INSERT INTO ${tableName} (${columnsArgument}) VALUES (${valuesArgument}) RETURNING *`;
    const values = valuesListClean;
    return db
      .query(query, values)
      .then((data) => data.rows[0])
      .catch((err) => new Error(err));
  };

  return `
    ${mutationName}: (parent, args) => {
      const query = 'INSERT INTO ${tableName} (${columnsArgument}) VALUES (${valuesArgument}) RETURNING *';
      const values = [${valuesList}];
      return db.query(query, values)
        .then(data => data.rows[0])
        .catch(err => new Error(err));
    },`;
};

resolverHelper.updateMutation = (
  tableName,
  primaryKey,
  columns,
  resolversObject
) => {
  const mutationName = toCamelCase('update_' + singular(tableName));
  const columnsArray = Object.keys(columns).filter(
    (column) => column != primaryKey
  );
  const setStatement = columnsArray
    .map((column, i) => `${column} = $${i + 1}`)
    .join(', ');
  const valuesList = [
    columnsArray.map((column) => `args.${column}`).join(', ') +
      `, args.${primaryKey}`,
  ];
  const primaryKeyArgument = `$${columnsArray.length + 1}`;

  // build resolversObject for makeExecutableSchema to generate GraphiQL playground
  resolversObject.Mutation[mutationName] = (parent, args) => {
    const valuesListClean = columnsArray.map((column) => args[column]);

    const query = `UPDATE ${tableName} SET ${setStatement} WHERE ${primaryKey} = ${primaryKeyArgument} RETURNING *`;
    const values = valuesListClean;
    return db
      .query(query, values)
      .then((data) => data.rows[0])
      .catch((err) => new Error(err));
  };

  return `
    ${mutationName}: (parent, args) => {
      const query = 'UPDATE ${tableName} SET ${setStatement} WHERE ${primaryKey} = ${primaryKeyArgument} RETURNING *';
      const values = [${valuesList}];
      return db.query(query, values)
        .then(data => data.rows[0])
        .catch(err => new Error(err));
    },`;
};

resolverHelper.deleteMutation = (tableName, primaryKey, resolversObject) => {
  const mutationName = toCamelCase('delete_' + singular(tableName));

  // build resolversObject for makeExecutableSchema to generate GraphiQL playground
  resolversObject.Mutation[mutationName] = (parent, args) => {
    const query = `DELETE FROM ${tableName} WHERE ${primaryKey} = $1 RETURNING *`;
    const values = [args[primaryKey]];
    return db
      .query(query, values)
      .then((data) => data.rows[0])
      .catch((err) => new Error(err));
  };

  return `
    ${mutationName}: (parent, args) => {
      const query = 'DELETE FROM ${tableName} WHERE ${primaryKey} = $1 RETURNING *';
      const values = [args.${primaryKey}];
      return db.query(query, values)
        .then(data => data.rows[0])
        .catch(err => new Error(err));
    },`;
};

/* */

resolverHelper.identifyRelationships = (
  tableName,
  sqlSchema,
  resolversObject,
  resolverName
) => {
  const { primaryKey, referencedBy, foreignKeys } = sqlSchema[tableName];
  let resolverBody = '';
  /* Keeps track of custom object types already added to resolverBody string */
  const inResolverBody = [];
  /* Looping through each table that references tableName */
  for (const refByTable of Object.keys(referencedBy)) {
    /* Shorthand labels for refByTable's properties */
    const { foreignKeys: refFK, columns: refCols } = sqlSchema[refByTable];
    /* If refByTable is a Junction Table we concat its ForeignKeys refTableName to resolverBody */
    if (isJunctionTable(refFK, refCols)) {
      /* Column name on Junction Table (refByTable) referencing the current tableName */
      let refByTableTableNameAlias = '';
      for (const fk of Object.keys(refFK)) {
        if (refFK[fk].referenceTable === tableName) {
          refByTableTableNameAlias = fk;
        }
      }
      /* Loop through refByTable's foreignkeys */
      for (const refByTableFK of Object.keys(refFK)) {
        /* Filtering out tableName */
        if (refFK[refByTableFK].referenceTable !== tableName) {
          const refByTableFKName =
            refFK[refByTableFK].referenceTable; /* refByTableFKName = people */
          const refByTableFKKey =
            refFK[refByTableFK].referenceKey; /* refByTableFKKey = _id */
          /* Check if refByTableFKName has already been added to resolverBody string */
          if (!inResolverBody.includes(refByTableFKName)) {
            inResolverBody.push(refByTableFKName);
            // console.log(
            //   'tableName: ',
            //   tableName,
            //   'primaryKey: ',
            //   primaryKey,
            //   'refByTableTableNameAlias: ',
            //   refByTableTableNameAlias,
            //   'refByTable: ',
            //   refByTable,
            //   'refByTableFK: ',
            //   refByTableFK,
            //   'refByTableFKName: ',
            //   refByTableFKName,
            //   'refByTableFKKey: ',
            //   refByTableFKKey
            // );

            /* Use inline comments below as example */
            resolverBody += resolverHelper.junctionTableRelationships(
              tableName, // -------------------species
              primaryKey, // ------------------_id
              refByTableTableNameAlias, // ----species_id
              refByTable, // ------------------species_in_films
              refByTableFK, // ----------------film_id
              refByTableFKName, // ------------films
              refByTableFKKey, // --------------_id
              resolversObject,
              resolverName
            );
          }
        }
      }
    } else {
      /* Check if refByTable has already been added to resolverBody string */
      if (!inResolverBody.includes(refByTable)) {
        inResolverBody.push(refByTable);
        const refByKey = referencedBy[refByTable];
        /* referencedBy tables that are not Junction tables */
        resolverBody += resolverHelper.customObjectsRelationships(
          tableName,
          primaryKey,
          refByTable,
          refByKey,
          resolversObject,
          resolverName
        );
      }
    }
    /* Creates resolvers for current tableName's foreignKeys */
    if (foreignKeys) {
      for (const fk of Object.keys(foreignKeys)) {
        const fkTableName = foreignKeys[fk].referenceTable;
        /* Check if fk has already been added to resolverBody string */
        if (!inResolverBody.includes(fkTableName)) {
          inResolverBody.push(fkTableName);
          const fkKey = foreignKeys[fk].referenceKey;
          resolverBody += resolverHelper.foreignKeyRelationships(
            tableName,
            primaryKey,
            fk,
            fkTableName,
            fkKey,
            resolversObject,
            resolverName
          );
        }
      }
    }
  }
  return resolverBody;
};

resolverHelper.junctionTableRelationships = (
  tableName,
  primaryKey,
  refByTableTableNameAlias,
  refByTable,
  refByTableFK,
  refByTableFKName,
  refByTableFKKey,
  resolversObject,
  resolverName
) => {
  // build resolversObject for makeExecutableSchema to generate GraphiQL playground
  resolversObject[resolverName][refByTableFKName] = (tableName) => {
    const query = `SELECT * FROM ${refByTableFKName} LEFT OUTER JOIN ${refByTable} ON ${refByTableFKName}.${refByTableFKKey} = ${refByTable}.${refByTableFK} WHERE ${refByTable}.${refByTableTableNameAlias} = $1`;
    const values = [tableName[primaryKey]];
    return db
      .query(query, values)
      .then((data) => data.rows)
      .catch((err) => new Error(err));
  };

  return `
    ${toCamelCase(refByTableFKName)}: (${toCamelCase(tableName)}) => {
      const query = 'SELECT * FROM ${refByTableFKName} LEFT OUTER JOIN ${refByTable} ON ${refByTableFKName}.${refByTableFKKey} = ${refByTable}.${refByTableFK} WHERE ${refByTable}.${refByTableTableNameAlias} = $1';
      const values = [${tableName}.${primaryKey}];
      return db.query(query, values)
        .then(data => data.rows)
        .catch(err => new Error(err));
    }, `;
};

resolverHelper.customObjectsRelationships = (
  tableName,
  primaryKey,
  refByTable,
  refByKey,
  resolversObject,
  resolverName
) => {
  const camelCasedRefByTable = toCamelCase(refByTable);
  const camelCasedTableName = toCamelCase(tableName);
  // build resolversObject for makeExecutableSchema to generate GraphiQL playground
  resolversObject[resolverName][camelCasedRefByTable] = (
    camelCasedTableName
  ) => {
    const query = 'SELECT * FROM ${refByTable} WHERE ${refByKey} = $1';
    const values = [camelCasedTableName[primaryKey]];
    return db
      .query(query, values)
      .then((data) => data.rows)
      .catch((err) => new Error(err));
  };

  return `
    ${toCamelCase(refByTable)}: (${toCamelCase(tableName)}) => {
      const query = 'SELECT * FROM ${refByTable} WHERE ${refByKey} = $1';
      const values = [${toCamelCase(tableName)}.${primaryKey}];
      return db.query(query, values)
        .then(data => data.rows)
        .catch(err => new Error(err));
    },`;
};

resolverHelper.foreignKeyRelationships = (
  tableName,
  primaryKey,
  fk,
  fkTableName,
  fkKey,
  resolversObject,
  resolverName
) => {
  const camelCasedFkTableName = toCamelCase(fkTableName);
  const camelCasedTableName = toCamelCase(tableName);
  // build resolversObject for makeExecutableSchema to generate GraphiQL playground
  resolversObject[resolverName][camelCasedFkTableName] = (
    camelCasedTableName
  ) => {
    const query =
      'SELECT ${fkTableName}.* FROM ${fkTableName} LEFT OUTER JOIN ${tableName} ON ${fkTableName}.${fkKey} = ${tableName}.${fk} WHERE ${tableName}.${primaryKey} = $1';
    const values = [camelCasedTableName[primaryKey]];
    return db
      .query(query, values)
      .then((data) => data.rows)
      .catch((err) => new Error(err));
  };

  return `
    ${toCamelCase(fkTableName)}: (${toCamelCase(tableName)}) => {
      const query = 'SELECT ${fkTableName}.* FROM ${fkTableName} LEFT OUTER JOIN ${tableName} ON ${fkTableName}.${fkKey} = ${tableName}.${fk} WHERE ${tableName}.${primaryKey} = $1';
      const values = [${toCamelCase(tableName)}.${primaryKey}];
      return db.query(query, values)
        .then(data => data.rows)
        .catch(err => new Error(err));
    }, `;
};

module.exports = resolverHelper;
