import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Roles
  const roles = [
    { name: 'ADMIN', description: 'System Administrator with full access' },
    { name: 'ASSET_MANAGER', description: 'Asset Manager in charge of inventory' },
    { name: 'DEPARTMENT_HEAD', description: 'Head of department managing members and assets' },
    { name: 'EMPLOYEE', description: 'Standard employee with resource booking and personal asset tracking access' },
  ];

  const dbRoles = {};
  for (const role of roles) {
    const dbRole = await prisma.role.upsert({
      where: { name: role.name },
      update: { description: role.description },
      create: { name: role.name, description: role.description },
    });
    dbRoles[role.name] = dbRole;
    console.log(`Role ${role.name} created/updated.`);
  }

  // 2. Departments
  const departments = [
    { name: 'IT Department', description: 'Information Technology' },
    { name: 'Human Resources', description: 'HR & Personnel' },
    { name: 'Finance & Accounting', description: 'Financial Operations' },
    { name: 'Facilities Management', description: 'Building & Workplace Operations' },
  ];

  const dbDepartments = [];
  for (const dept of departments) {
    const dbDept = await prisma.department.create({
      data: {
        name: dept.name,
        description: dept.description,
        status: 'ACTIVE',
      },
    });
    dbDepartments.push(dbDept);
    console.log(`Department ${dept.name} created.`);
  }

  // 3. Asset Categories
  const categories = [
    { name: 'Electronics', description: 'Laptops, desktops, screens, accessories', defaultMaintenanceDays: 90 },
    { name: 'Furniture', description: 'Desks, chairs, filing cabinets', defaultMaintenanceDays: 365 },
    { name: 'Vehicles', description: 'Company cars and transport vans', defaultMaintenanceDays: 180 },
    { name: 'Meeting Rooms', description: 'Shared conference spaces', defaultMaintenanceDays: 30 },
  ];

  for (const cat of categories) {
    await prisma.assetCategory.create({
      data: {
        name: cat.name,
        description: cat.description,
        defaultMaintenanceDays: cat.defaultMaintenanceDays,
        status: 'ACTIVE',
      },
    });
    console.log(`Category ${cat.name} created.`);
  }

  const saltRounds = 10;
  const adminPassword = await bcrypt.hash('Admin@123', saltRounds);
  const managerPassword = await bcrypt.hash('Manager@123', saltRounds);
  const headPassword = await bcrypt.hash('Head@123', saltRounds);
  const employeePassword = await bcrypt.hash('Employee@123', saltRounds);

  // 4. Default Users
  const users = [
    {
      firstName: 'System',
      lastName: 'Admin',
      email: 'admin@assetflow.com',
      password: adminPassword,
      roleId: dbRoles['ADMIN'].id,
      departmentId: dbDepartments[0].id,
    },
    {
      firstName: 'Asset',
      lastName: 'Manager',
      email: 'manager@assetflow.com',
      password: managerPassword,
      roleId: dbRoles['ASSET_MANAGER'].id,
      departmentId: dbDepartments[0].id,
    },
    {
      firstName: 'John',
      lastName: 'Doe',
      email: 'head@assetflow.com',
      password: headPassword,
      roleId: dbRoles['DEPARTMENT_HEAD'].id,
      departmentId: dbDepartments[0].id,
    },
    {
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'employee@assetflow.com',
      password: employeePassword,
      roleId: dbRoles['EMPLOYEE'].id,
      departmentId: dbDepartments[1].id,
    },
  ];

  for (const user of users) {
    const dbUser = await prisma.user.create({
      data: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        password: user.password,
        roleId: user.roleId,
        departmentId: user.departmentId,
        status: 'ACTIVE',
      },
    });

    if (user.email === 'head@assetflow.com') {
      await prisma.department.update({
        where: { id: dbDepartments[0].id },
        data: { departmentHeadId: dbUser.id },
      });
      console.log(`Set John Doe as head of IT Department.`);
    }
    console.log(`User ${user.email} created.`);
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
