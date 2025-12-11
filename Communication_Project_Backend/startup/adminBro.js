const AdminBro = require('admin-bro')
const AdminBroMongoose = require('@admin-bro/mongoose')

AdminBro.registerAdapter(AdminBroMongoose)



const AdminBroOptions = {
resources: [User],
}
const AdminBro = new AdminBro(AdminBroOptions)
const router = AdminBroExpress.buildRouter(adminBro)