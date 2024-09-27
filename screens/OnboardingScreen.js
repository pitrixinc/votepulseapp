import React, { useEffect, useState } from 'react';
import {View, Text, Image, TouchableOpacity, Alert, StyleSheet, Dimensions, ImageBackground } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/firebaseConfig';

const { width, height } = Dimensions.get('window');

export default function OnboardingScreen() {
  const navigation = useNavigation();
  const [activeButton, setActiveButton] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Fetch user data from Firestore
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const userType = userData.userType;

            // Redirect to the appropriate portal based on user type
            if (userType === 'voter') {
              Alert.alert(`Welcome back ${userData.fullName}`, 'You have already logged in');
              navigation.replace('VoterDashboard');
            } else if (userType === 'admin') {
              Alert.alert(`Welcome back Super Admin ${userData.fullName}`, 'You have already logged in');
              navigation.replace('AdminDashboard');
            }
          } else {
            console.log('No such document!');
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      }
    });

    return () => unsubscribe();
  }, [navigation]);

  const handleButtonPress = (button) => {
    setActiveButton(button);
  };

  const handleButtonRelease = () => {
    setActiveButton(null);
  };

  return (
    <ImageBackground
      source={require('../assets/images/background2.webp')}
      style={styles.backgroundImage}
      imageStyle={{ opacity: 0.7 }} // Background image opacity
    >
      <View style={styles.overlay} />
      
      <View style={styles.logoContainer}>
        <Image
          source={require('../assets/icon.png')}
          style={styles.logo}
        />
      </View>

      <Text style={styles.welcomeText}>Welcome to VotePulse!</Text>
      <Text style={styles.subText}>Vote with confidence—just a fingerprint away from a secure and effortless voting experience. Let's make your voice heard!.</Text>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.getStartedButton,
            activeButton === 'signup' && styles.activeButton
          ]}
          onPressIn={() => handleButtonPress('signup')}
          onPressOut={handleButtonRelease}
          onPress={() => navigation.navigate('Signup')}
        >
          <Text style={styles.buttonText}>Sign Up</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.getStartedButton,
            activeButton === 'login' && styles.activeButton
          ]}
          onPressIn={() => handleButtonPress('login')}
          onPressOut={handleButtonRelease}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.buttonText}>Login</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)', // Dark overlay for a clean contrast
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)', // Transparent overlay for logo
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    borderWidth: 2,
    borderColor: '#fff', // Border for logo container
  },
  logo: {
    width: 70,
    height: 70,
    resizeMode: 'contain',
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
  },
  subText: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 50,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 50,
    width: width * 0.8,
    alignItems: 'center',
  },
  getStartedButton: {
    backgroundColor: 'rgba(128, 128, 128, 0.5)', // Gray background with transparency
    paddingVertical: 15,
    borderRadius: 30,
    marginVertical: 5,
    width: '100%',
  },
  activeButton: {
    backgroundColor: '#007BFF', // Blue background when active
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});






{/*
import React, { useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/firebaseConfig';

const { width, height } = Dimensions.get('window');

export default function OnboardingScreen() {
  const navigation = useNavigation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Fetch user data from Firestore
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const userType = userData.userType;

            // Redirect to the appropriate portal based on user type
            if (userType === 'buyer') {
              Alert.alert(`Welcome back ${userData.fullName}`, 'You have already logged in');
              navigation.replace('BuyerDashboard');
            } else if (userType === 'vendor') {
              Alert.alert(`Welcome back Vendor ${userData.fullName}`, 'You have already logged in');
              navigation.replace('VendorDashboard');
            } else if (userType === 'admin') {
              Alert.alert(`Welcome back Super Admin ${userData.fullName}`, 'You have already logged in');
              navigation.replace('AdminDashboard');
            }
          } else {
            console.log('No such document!');
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      }
    });

    return () => unsubscribe();
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Image source={require('../assets/icon.png')} style={styles.logo} />
      <Text style={styles.title}>Mojee</Text>
      <Text style={styles.subtitle}>
        Your health is our priority. Book appointments and request ambulance services at your convenience.
      </Text>
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('Login')}
      >
        <Text style={styles.buttonText}>Get Started</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 15,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  button: {
    backgroundColor: '#007BFF',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 30,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

*/}


