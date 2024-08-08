const schema=/* GraphQL */ `
    type Query {
      uploadRequest: String
    }
    type Mutation {
      collageRequest(request: createRequestInput!): Request
      uploadRequest(info: uploadRequestInput!): User
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
    }
    input createRequestInput {
      userId: String!
      images: [String]!
      borderColor: String!
      verticalOrHorizontal: String!
      borderSize: Int!
    }
    type Request {
      id:ID
      images: [String]
      borderColor: String
      verticalOrHorizontal: String
      borderSize: String
      state: String
    }
  `
export default schema