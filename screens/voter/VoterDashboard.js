import React, { useEffect, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'react-native';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase/firebaseConfig'; // Import Firebase config
import VoterProfile from './VoterProfile';
import VoterVotes from './VoterVotes';
import VoterHome from './VoterHome';
import ElectionsDiscovery from './ElectionsDiscovery';

const Tab = createBottomTabNavigator();

export default function VoterDashboard() {
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
            case 'Home':
              iconName = 'home-outline';
              break;
            case 'Elections Discovery':
              iconName = 'bar-chart-outline';
              break;
            case 'Your Votes':
              iconName = 'bookmarks-outline';
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
      <Tab.Screen name="Home" component={VoterHome} />
      <Tab.Screen name="Elections Discovery" component={ElectionsDiscovery} />
      <Tab.Screen name="Your Votes" component={VoterVotes} />
      <Tab.Screen name="Profile" component={VoterProfile} />
    </Tab.Navigator>
  );
}
