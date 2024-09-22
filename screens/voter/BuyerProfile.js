import React, { useState, useEffect } from 'react';
import { View, TextInput, Button, Image, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { getDoc, doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase/firebaseConfig';
import { signOut } from 'firebase/auth'; // Import signOut function from Firebase
import { useNavigation } from '@react-navigation/native';

export default function BuyerProfile() {
  const navigation = useNavigation();

  const [profile, setProfile] = useState({
    fullName: '',
    email: '',
    location: '',
    profileImage: '', // User's profile image
  });

  const user = auth.currentUser;

  useEffect(() => {
    const fetchProfile = async () => {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        setProfile(userDoc.data());
      }
    };
    fetchProfile();
  }, [user]);

  const handleUpdate = async () => {
    await updateDoc(doc(db, 'users', user.uid), profile);
    alert('Profile updated successfully!');
  };

  const handleLogout = async () => {
    await signOut(auth); // Sign out the user
    alert('You logged out successfully!');
    // You might want to navigate the user to the login screen after logout
    navigation.replace('Onboarding');
  };

  return (
    <View style={styles.container}>
      <Image
        source={{ uri: profile.profileImage || '../../assets/images/default_profile.jpg' }} // Default image if profileImage is empty
        style={styles.profileImage}
      />
      <TextInput
        style={styles.input}
        value={profile.fullName}
        onChangeText={(text) => setProfile({ ...profile, fullName: text })}
        placeholder="Full Name"
      />
      <TextInput
        style={styles.input}
        value={profile.email}
        onChangeText={(text) => setProfile({ ...profile, email: text })}
        placeholder="Email"
        // keyboardType="email-address"
        editable={false} // This disables the TextInput
      />
      <TextInput
        style={styles.input}
        value={profile.location}
        onChangeText={(text) => setProfile({ ...profile, location: text })}
        placeholder="Location"
      />
      <Button title="Update Profile" onPress={handleUpdate} />

      {/* Styled Logout Button */}
      <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#FFDBBB',
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 20,
    alignSelf: 'center',
    borderWidth: 2,
    borderColor: '#2980B9',
  },
  input: {
    borderBottomWidth: 1,
    marginBottom: 20,
    padding: 10,
    fontSize: 16,
  },
  logoutButton: {
    backgroundColor: '#E74C3C',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
