const { createTypes, createResolvers } = require('../GQLFactory/schemaFactory');
const GQLController = {};
const { makeExecutableSchema } = require('graphql-tools');
const { Pool } = require('pg');

GQLController.createGQLSchema = (req, res, next) => {
  const { SQLSchema } = res.locals;
  // try {
  const { types, typeDefs } = createTypes(SQLSchema);
  const { resolvers, resolversObject } = createResolvers(SQLSchema);
  res.locals.GQLSchema = { types, resolvers };

  // console.log(resolvers);

  // console.log(resolversObj);
  // const result = eval(resolversObj);
  // console.log(result);

  // console.log(typeof looseJsonParse(resolversObj));

  // res.locals.executableSchema = { typeDefs, resolversObject };
  // console.log(resolversObject);
  // res.locals.executableSchema = resolversObject;
  // console.log(res.locals.executableSchema.Query);

  const pool = new Pool({
    connectionString: res.locals.PSQLURI,
  });

  const db = {};
  db.query = (text, params, callback) => {
    console.log('executed query:', text);
    return pool.query(text, params, callback);
  };

  //
  function looseJsonParse(obj) {
    const pool = new Pool({
      connectionString: res.locals.PSQLURI,
    });

    const db = {};
    db.query = (text, params, callback) => {
      console.log('executed query:', text);
      return pool.query(text, params, callback);
    };

    return Function('"use strict";return (' + obj + ')')();
  }
  const resolversObj = resolvers.substring(19);
  const resolversObjectClean = looseJsonParse(resolversObj);
  console.log(resolversObjectClean.Query.person.toString());

  console.log(resolversObjectClean.Query.person(null, 1));

  res.locals.executedSchema = makeExecutableSchema({
    typeDefs,
    // resolversObject,
    resolversObjectClean,
    allowUndefinedInResolve: false,
    // resolverValidationOptions: { requireResolversForArgs: 'error' },
    // requireResolversForAllFields: 'warn',
  });
  // console.log('RES.LOCALS.EXECUTEDSCHEMA: ', res.locals.executedSchema);
  return next();
  // } catch (err) {
  //   const errObject = {
  //     log: `Error in createGQLSchema: ${err}`,
  //     status: 400,
  //     message: {
  //       err: 'Unable to create GQL schema',
  //     },
  //   };
  //   return next(errObject);
  // }
};

/* GQLController.createGQLServer = (req, res, next) => {
  const PG_URI = req.body.link;
  const { typeDefs, resolvers } = res.locals.GQLSchema;
  const pool = new Pool({
    connectionString: PG_URI,
  });
  const schema = makeExecutableSchema({ typeDefs, resolvers });

}; */
module.exports = GQLController;
