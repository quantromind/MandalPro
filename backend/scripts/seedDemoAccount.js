require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');
const Mandal = require('../src/models/Mandal');
const Donation = require('../src/models/Donation');
const Expense = require('../src/models/Expense');
const Event = require('../src/models/Event');
const Otp = require('../src/models/Otp');

const seedDemoAccounts = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      console.error('MONGO_URI is not defined in .env');
      process.exit(1);
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB successfully.');

    const demoEmails = [
      'demo@mandalpro.com',
      'demo@aplamandal.com',
      'reviewer@mandalpro.com',
      'reviewer@aplamandal.com'
    ];

    for (const email of demoEmails) {
      console.log(`\n--- Setting up demo account for: ${email} ---`);

      // 1. Ensure Fixed OTP is saved
      await Otp.deleteMany({ email });
      await Otp.create({ email, code: '123456' });
      console.log(`✓ OTP 123456 saved for ${email}`);

      // 2. Check if user already exists
      let user = await User.findOne({ email });
      let mandal = null;

      if (!user) {
        // Create Demo Mandal
        mandal = await Mandal.create({
          name: 'Shree Ganesh Utsav Mandal (Demo)',
          eventTypes: ['Ganesh Utsav', 'Navratri', 'Jayanti'],
          plan: 'Pro',
          planStatus: 'Active',
          receiptPrefix: 'SGUM',
          onboardingComplete: true,
          checklist: {
            eventTypesSelected: true,
            planSelected: true,
            profileComplete: true,
            firstEvent: true,
            firstDonation: true
          }
        });

        const passwordHash = await User.hashPassword('DemoMandal@2026');
        user = await User.create({
          name: 'Demo President',
          email,
          mobile: '9876543210',
          passwordHash,
          role: 'president',
          mandalId: mandal._id,
          mandalIds: [mandal._id],
          status: 'active'
        });

        mandal.createdBy = user._id;
        await mandal.save();
        console.log(`✓ Created demo user and mandal: ${mandal.name}`);
      } else {
        mandal = await Mandal.findById(user.mandalId);
        if (!mandal) {
          mandal = await Mandal.create({
            name: 'Shree Ganesh Utsav Mandal (Demo)',
            eventTypes: ['Ganesh Utsav', 'Navratri', 'Jayanti'],
            plan: 'Pro',
            planStatus: 'Active',
            receiptPrefix: 'SGUM',
            onboardingComplete: true,
            checklist: {
              eventTypesSelected: true,
              planSelected: true,
              profileComplete: true,
              firstEvent: true,
              firstDonation: true
            }
          });
          user.mandalId = mandal._id;
          user.mandalIds = [mandal._id];
          user.role = 'president';
          await user.save();
        } else {
          mandal.plan = 'Pro';
          mandal.planStatus = 'Active';
          mandal.onboardingComplete = true;
          if (mandal.checklist) {
            mandal.checklist.eventTypesSelected = true;
            mandal.checklist.planSelected = true;
            mandal.checklist.profileComplete = true;
            mandal.checklist.firstEvent = true;
            mandal.checklist.firstDonation = true;
          }
          await mandal.save();
        }
        console.log(`✓ Existing user configured: ${user.name} with Mandal: ${mandal.name}`);
      }

      if (mandal) {
        // Seed sample event if none exists
        let event = await Event.findOne({ mandalId: mandal._id });
        if (!event) {
          event = await Event.create({
            mandalId: mandal._id,
            name: 'Ganesh Utsav 2026',
            type: 'Ganesh Utsav',
            startDate: new Date(),
            endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
            status: 'Active',
            createdBy: user._id
          });
          console.log(`✓ Sample Event created: ${event.name}`);
        }

        // Seed sample donations if none exist
        const donationCount = await Donation.countDocuments({ mandalId: mandal._id });
        if (donationCount === 0 && event) {
          await Donation.create([
            {
              mandalId: mandal._id,
              eventId: event._id,
              donorName: 'Rahul Sharma',
              donorMobile: '9876500001',
              amount: 2100,
              purpose: 'Aarti & Puja',
              paymentMode: 'upi',
              receiptNumber: 'SGUM-0001',
              idempotencyKey: `demo-donation-1-${email}`,
              collectedBy: user._id,
              status: 'Issued'
            },
            {
              mandalId: mandal._id,
              eventId: event._id,
              donorName: 'Pooja Patil',
              donorMobile: '9876500002',
              amount: 5100,
              purpose: 'Prasad & Bhog',
              paymentMode: 'cash',
              receiptNumber: 'SGUM-0002',
              idempotencyKey: `demo-donation-2-${email}`,
              collectedBy: user._id,
              status: 'Issued'
            }
          ]);
          console.log(`✓ Sample Donations created`);
        }

        // Seed sample expenses if none exist
        const expenseCount = await Expense.countDocuments({ mandalId: mandal._id });
        if (expenseCount === 0 && event) {
          await Expense.create([
            {
              mandalId: mandal._id,
              eventId: event._id,
              category: 'Decoration',
              amount: 3500,
              vendor: 'Royal Decorators',
              description: 'Mandap flower and stage decoration',
              paymentType: 'digital',
              status: 'Approved',
              createdBy: user._id
            },
            {
              mandalId: mandal._id,
              eventId: event._id,
              category: 'Sound & Lights',
              amount: 2000,
              vendor: 'Sai Sound System',
              description: 'Microphones and lighting setup',
              paymentType: 'cash',
              status: 'Approved',
              createdBy: user._id
            }
          ]);
          console.log(`✓ Sample Expenses created`);
        }
      }
    }

    console.log('\n======================================================');
    console.log('✅ DEMO CREDENTIALS SAVED IN DATABASE:');
    console.log('  Email: demo@mandalpro.com');
    console.log('  Email: demo@aplamandal.com');
    console.log('  Email: reviewer@mandalpro.com');
    console.log('  Static OTP: 123456');
    console.log('======================================================\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error seeding demo accounts:', err);
    process.exit(1);
  }
};

seedDemoAccounts();
