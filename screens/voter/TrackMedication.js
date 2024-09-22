import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Image, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { collection, addDoc, getDocs, query, where, getDoc, doc } from 'firebase/firestore';
import { db, storage, auth } from '../../firebase/firebaseConfig';
import { useNavigation } from '@react-navigation/native';

export default function TrackMedication() {
  const [problem, setProblem] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [activeTab, setActiveTab] = useState('Unanswered');
  const [unansweredMeds, setUnansweredMeds] = useState([]);
  const [answeredMeds, setAnsweredMeds] = useState([]);
  const navigation = useNavigation();
  const [userDetails, setUserDetails] = useState({});
  
  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setUserDetails(userDoc.data());
        }
      }
    };

    fetchUserData();
  }, []);

  useEffect(() => {
    const fetchMedications = async () => {
      const user = auth.currentUser;
      if (user) {
        try {
          const medsRef = collection(db, 'medicationRequests');
          const q = query(medsRef, where('userId', '==', user.uid));
          const querySnapshot = await getDocs(q);
          const unanswered = [];
          const answered = [];
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            if (data.status === 'unanswered') {
              unanswered.push({ id: doc.id, ...data });
            } else {
              answered.push({ id: doc.id, ...data });
            }
          });
          setUnansweredMeds(unanswered);
          setAnsweredMeds(answered);
        } catch (error) {
          console.error('Error fetching medication requests:', error);
        }
      }
    };

    fetchMedications();
  }, []);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (problem === '' || !selectedImage) {
      Alert.alert('Please fill out all required fields');
      return;
    }

    const user = auth.currentUser;
    if (user) {
      try {
        const imageRef = ref(storage, `medicationImages/${user.uid}/${Date.now()}.jpg`);
        const response = await fetch(selectedImage);
        const blob = await response.blob();
        await uploadBytes(imageRef, blob);
        const imageUrl = await getDownloadURL(imageRef);

        const medsRef = collection(db, 'medicationRequests');
        const newDoc = await addDoc(medsRef, {
          userId: user.uid,
          fullName: userDetails.fullName,
          email: userDetails.email,
          location: userDetails.location,
          userImage: userDetails.profileImage,
          medicationRequestId: medsRef.id, 
          problem, 
          imageUrl,
          status: 'unanswered',
          createdAt: new Date().toDateString(),
        });

        setProblem('');
        setSelectedImage(null);
        Alert.alert('Success', 'Your medication request has been successfully created.');
       // navigation.navigate('MedicalRecords');
      } catch (error) {
        console.error('Error submitting medication request:', error);
        Alert.alert('Error submitting medication request');
      }
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Current Medication</Text>
        <TextInput
          style={styles.input}
          placeholder="Problem/Illness"
          value={problem}
          onChangeText={setProblem}
          multiline
        />

        <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
          {selectedImage ? (
            <Image source={{ uri: selectedImage }} style={styles.selectedImage} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={styles.imagePlaceholderText}>Select Image</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>Submit</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Previous Medications</Text>
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'Unanswered' && styles.activeTab]}
            onPress={() => setActiveTab('Unanswered')}
          >
            <Text style={[styles.tabText, activeTab === 'Unanswered' && styles.activeTabText]}>Unanswered</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'Answered' && styles.activeTab]}
            onPress={() => setActiveTab('Answered')}
          >
            <Text style={[styles.tabText, activeTab === 'Answered' && styles.activeTabText]}>Answered</Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'Unanswered' ? (
          unansweredMeds.length > 0 ? (
            unansweredMeds.map((med) => (
              <View key={med.id} style={styles.medicationItem}>
                <Image source={{ uri: med.imageUrl }} style={styles.medicationImage} />
                <View style={styles.medicationDetails}>
                  <Text style={styles.medicationCreatedAt}>{med.createdAt}</Text>
                  <Text style={styles.medicationText}>{med.problem}</Text>
                  <Text style={styles.medicationStatus}>Status: Unanswered</Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.noMedicationText}>No unanswered medications found.</Text>
          )
        ) : (
          answeredMeds.length > 0 ? (
            answeredMeds.map((med) => (
              <View key={med.id} style={styles.medicationAnsweredItem}>
                <Image source={{ uri: med.imageUrl }} style={styles.medicationAnsweredImage} />
                <View style={styles.medicationDetails}>
                  <Text style={styles.medicationCreatedAt}>{med.createdAt}</Text>
                  <Text style={styles.medicationText}>{med.problem}</Text>
                  <Text style={styles.medicationStatus}>Status: Answered</Text>

                  <Text style={styles.medicationCreatedAt}>MEDICATION</Text>
                  <Text style={styles.medicationText}>{med.feedback}</Text>
                  <Text style={styles.medicationStatus}>Updated on: {med.updatedDate} </Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.noMedicationText}>No answered medications found.</Text>
          )
        )}
      </View>
    </ScrollView>
  );
}

const styles = {
  container: {
    flexGrow: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#fff',
    marginBottom: 16,
    textAlignVertical: 'top',
    height: 100,
  },
  imagePicker: {
    marginBottom: 16,
  },
  imagePlaceholder: {
    width: 100,
    height: 100,
    backgroundColor: '#e1e1e1',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  imagePlaceholderText: {
    color: '#aaa',
  },
  selectedImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  submitButton: {
    backgroundColor: '#007BFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  tabs: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    padding: 12,
    backgroundColor: '#e1e1e1',
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  activeTab: {
    backgroundColor: '#007BFF',
  },
  tabText: {
    color: '#333',
    fontSize: 16,
  },
  activeTabText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  medicationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 12,
  },
  medicationAnsweredItem: {
   // flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 12,
  },
  medicationImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
  },
  medicationAnsweredImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
   // marginRight: 12,
  },
  medicationDetails: {
    flex: 1,
  },
  medicationText: {
    fontSize: 16,
    color: '#333',
  },
  medicationStatus: {
    fontSize: 14,
    color: '#007BFF',
  },
  medicationCreatedAt: {
    fontSize: 14,
    color: '#007BFF',
    fontWeight: 'bold',
  },
  noMedicationText: {
    textAlign: 'center',
    color: '#777',
    fontSize: 16,
    marginTop: 20,
  },
};
