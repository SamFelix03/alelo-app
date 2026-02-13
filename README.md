# Alelo -  App

Alelo is a mobile app that connects street vendors with local customers in real-time. The app supports two user roles:
- **Buyers**: Find and purchase from local vendors
- **Sellers**: Showcase and sell products to nearby customers

Demo video - [View Here](https://www.canva.com/design/DAHBNthgWJE/7mlLRePlnF2ZbNaVImIq5A/watch?utm_content=DAHBNthgWJE&utm_campaign=designshare&utm_medium=link2&utm_source=uniquelinks&utlId=h4932c81442)

## Setup

1. Make sure you have Node.js and npm installed
2. Install Expo CLI globally:
   ```
   npm install -g expo-cli
   ```
3. Install dependencies:
   ```
   npm install
   ```
   or if you use yarn:
   ```
   yarn install
   ```

## Running the App

Start the Expo development server:
```
npm run dev
```

You can run the app in the following ways:
- Scan the QR code with the Expo Go app on your iOS or Android device
- Press `a` to open on an Android emulator
- Press `i` to open on an iOS simulator

## App Structure

- **Auth Flow**: Role selection, OTP verification, and onboarding for both buyer and seller roles
- **Buyer Experience**: Map view, list view, shop view, orders, profile, and notifications
- **Seller Experience**: Dashboard, products management, orders, customers, and profile

## Development Notes

This app is built with:
- Expo
- React Native
- React Navigation for routing
- Tailwind CSS for styling
- React Hook Form for form handling 
