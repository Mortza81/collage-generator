const schema = /* GraphQL */ `
  type Query {
    showMyRequests(email: String!): [Request]
    showOneRequest(request: ID!): Request
    showRequestLog(request: ID!): [Log]
  }
  type Mutation {
    collageRequest(request: createRequestInput!): Request
    uploadRequest(info: uploadRequestInput!): User
    cancelRequest(request: ID!):String
  }
  type Log {
    message: String
    request: ID
    date: String
  }
  type User {
    name: String
    email: String
    id: ID
    uploadUrl: String
  }
  input uploadRequestInput {
    name: String!
    email: String!
    fileName:String!
  }
  input createRequestInput {
    email: String!
    images: [String]!
    borderColor: String!
    verticalOrHorizontal: String!
    borderSize: Int!
  }
  type Request {
    id: ID
    images: [String]
    borderColor: String
    verticalOrHorizontal: String
    borderSize: String
    state: String
    link: String
  }
`;
export default schema;
