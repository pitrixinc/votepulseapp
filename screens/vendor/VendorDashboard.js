// /screens/vendor/VendorDashboard.js
import React, { useEffect, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'react-native';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase/firebaseConfig'; // Import Firebase config
import VendorHome from './VendorHome';
import VendorNotifications from './VendorNotifications';
import VendorProfile from './VendorProfile';
import VendorRestaurant from './VendorRestaurant';

const Tab = createBottomTabNavigator();

export default function VendorDashboard() {

    const [profileImage, setProfileImage] = useState(null);

  useEffect(() => {
    const fetchProfileImage = async () => {
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid)); 
        if (userDoc.exists()) {
          setProfileImage(userDoc.data().profileImage);
        }
      }
    };

    fetchProfileImage();
  }, []);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          if (route.name === 'Profile' && profileImage) {
            return (
              <Image
                source={{ uri: profileImage }}
                style={{ width: size, height: size, borderRadius: size / 2 }}
              />
            );
          }

          let iconName;
          switch (route.name) {
            case 'Vendor Home':
              iconName = 'home-outline';
              break;
            case 'Vendor Restaurant':
              iconName = 'add-circle-outline';
              break;
            case 'Vendor Notifications':
              iconName = 'notifications-outline';
              break;
            default:
              iconName = 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007BFF',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="Vendor Home" component={VendorHome} />
      <Tab.Screen name="Vendor Restaurant" component={VendorRestaurant} />
      <Tab.Screen name="Vendor Notifications" component={VendorNotifications} />
      <Tab.Screen name="Profile" component={VendorProfile} />
    </Tab.Navigator>
  );
}