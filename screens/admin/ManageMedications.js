// /screens/admin/ManageMedications.js
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, Image, StyleSheet, Alert } from 'react-native';
import { collection, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig'; // Import your Firebase configuration

export default function ManageMedications() {
  const [medications, setMedications] = useState([]);
  const [activeTab, setActiveTab] = useState('unanswered');
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    const fetchMedications = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'medicationRequests'));
        const medicationsData = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        setMedications(medicationsData);
      } catch (error) {
        console.log('Error fetching medications:', error);
      }
    };

    fetchMedications();
  }, []);

  const handleUpdateMedication = async (id) => {
    try {
      const updatedDate = new Date().toDateString();
      await updateDoc(doc(db, 'medicationRequests', id), { status: 'answered', feedback, updatedDate });
      Alert.alert('Success', 'Medication updated successfully');
      setMedications(prev => prev.map(med => med.id === id ? { ...med, status: 'answered', feedback, updatedDate } : med));
    } catch (error) {
      console.log('Error updating medication:', error);
    }
  };

  const handleDeleteMedication = async (id) => {
    try {
      await deleteDoc(doc(db, 'medicationRequests', id));
      Alert.alert('Success', 'Medication deleted successfully');
      setMedications(prev => prev.filter(med => med.id !== id));
    } catch (error) {
      console.log('Error deleting medication:', error);
    }
  };

  const renderMedications = () => {
    const filteredMedications = medications.filter(med => med.status === activeTab);
    if (filteredMedications.length === 0) {
      return <Text style={styles.noMedicationsText}>No {activeTab === 'unanswered' ? 'Unanswered' : 'Answered'} Medications</Text>;
    }

    return filteredMedications.map(medication => (
      <View key={medication.id} style={styles.card}>
        <View style={styles.avatarContainer}>
          <Image source={{ uri: medication.userImage || 'https://static.vecteezy.com/system/resources/thumbnails/036/280/650/small/default-avatar-profile-icon-social-media-user-image-gray-avatar-icon-blank-profile-silhouette-illustration-vector.jpg' }} style={styles.userImage} />
          <View style={styles.infoContainer}>
            <Text style={styles.fullName}>{medication.fullName}</Text>
            <Text style={styles.location}>{medication.email}</Text>
            <Text style={styles.location}>{medication.location}</Text>
          </View>
        </View>
        
        <Image source={{ uri: medication.imageUrl}} style={styles.medicationAnsweredImage} />

        <Text style={styles.label}>Created on:</Text>
        <TextInput style={styles.input} value={medication.createdAt} editable={false} />

        <Text style={styles.label}>Problem:</Text>
        <TextInput style={styles.input} value={medication.problem} editable={false}  multiline />
        
        <Text style={styles.label}>Location:</Text>
        <TextInput style={styles.input} value={medication.location} editable={false} />

        <Text style={styles.label}>Status:</Text>
        <TextInput style={styles.input} value={medication.status} editable={false} />

{medication.status === 'answered'  && (
   <View>
        <Text style={styles.label}>Updated on:</Text>
        <TextInput style={styles.input} value={medication.updatedDate} editable={false} />

        <Text style={styles.label}>Feedback:</Text>
        <TextInput style={styles.input} value={medication.feedback} editable={false} multiline />
        </View>)}
        {activeTab === 'unanswered' && (
          <TextInput
            style={styles.textArea}
            placeholder="Admin Feedback"
            value={feedback}
            onChangeText={text => setFeedback(text)}
            multiline
          />
        )}
        <View style={styles.buttonContainer}>
          {activeTab === 'unanswered' && (
            <TouchableOpacity
              style={styles.updateButton}
              onPress={() => handleUpdateMedication(medication.id)}
            >
              <Text style={styles.buttonText}>Update Medication</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteMedication(medication.id)}
          >
            <Text style={styles.buttonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    ));
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'unanswered' && styles.activeTab]}
          onPress={() => setActiveTab('unanswered')}
        >
          <Text style={styles.tabText}>Unanswered</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'answered' && styles.activeTab]}
          onPress={() => setActiveTab('answered')}
        >
          <Text style={styles.tabText}>Answered</Text>
        </TouchableOpacity>
      </View>
      {renderMedications()}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f9f9f9',
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#ddd',
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  activeTab: {
    backgroundColor: '#007BFF',
  },
  tabText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },


  label: {
    fontSize: 15,
    color: '#333',
    marginBottom: 5,
    fontWeight: 900,
  },
  avatarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    elevation: 3, // For Android shadow
    shadowColor: '#000', // For iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    gap: 2,
  },
  userImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#ddd', // Light border color for the image
  },
  infoContainer: {
    justifyContent: 'center',
  },
  fullName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  location: {
    fontSize: 14,
    color: '#777',
  },
  medicationAnsweredImage: {
    width: '100%',
    height: 250,
    borderRadius: 8,
   // marginRight: 12,
  },





  input: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    color: '#333',
  },
  textArea: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    color: '#333',
    height: 100,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  updateButton: {
    backgroundColor: '#28a745',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  deleteButton: {
    backgroundColor: '#dc3545',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  noMedicationsText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#555',
  },
});
