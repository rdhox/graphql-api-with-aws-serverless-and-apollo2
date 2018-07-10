const AWS = require('aws-sdk');
const promisify = require('../functions/promisify');
const crypto = require('crypto');

dynamoDb = new AWS.DynamoDB.DocumentClient();

//Schema of user

exports.userTypeDef = `
    type User {
        ID: String
        email: String
        country: String
    }
    type Query {
        user(ID: String!): User
    }
    type Mutation {
        createUser(email: String): Boolean
        updateUser(ID: String, country: String): User
    }
`;

exports.userResolvers = {
    Query: {
        user: (_, { ID }) => getUser(ID),
    },
    Mutation: {
        createUser: (_, { email }) => createUser(email),
        updateUser: (_, { ID, country }) => updateUser(ID, country),
    }
};

// Lambda functions of user

const createUser = email => promisify(callback => 
    dynamoDb.put({
        TableName: process.env.USER_TABLE,
        Item: {
            ID: crypto.createHash('md5').update(email).digest('hex').toString(),
            email: email,
        },
        ConditionExpression: 'attribute_not_exists(#u)',
        ExpressionAttributeNames: {'#u': 'ID'},
        ReturnValues: 'ALL_OLD',
    }, callback))
    .then( (result) => true)
    .catch(error => {
        console.log(error)
        return false;
    })

const getUser = ID => promisify(callback =>
    dynamoDb.get({
        TableName: process.env.USER_TABLE,
        Key: { ID },
    }, callback))
    .then(result => {
        if(!result.Item){ return ID; }
        return result.Item;
    })
    .catch(error => console.error(error))

const updateUser = (ID, country) => promisify(callback => 
    dynamoDb.update({
        TableName: process.env.USER_TABLE,
        Key: { ID },
        UpdateExpression: 'SET #foo = :bar',
        ExpressionAttributeNames: {'#foo' : 'country'},
        ExpressionAttributeValues: {':bar' : country},
        ReturnValues: 'ALL_NEW'
    }, callback))
    .then(result => result.Attributes)
    .catch(error => console.log(error))