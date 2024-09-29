import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
  Alert,
  Platform,
  Button
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import {
  addDoc,
  collection,
  doc,
  getDoc,
} from 'firebase/firestore';
import { auth, db, storage } from '../../firebase/firebaseConfig';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function CreateElection() {
  const [image, setImage] = useState(null);
  const [electionName, setElectionName] = useState('');
  const [faculty, setFaculty] = useState('');
  const [candidates, setCandidates] = useState([{ name: '', image: null, faculty: '', level: '' }]);


  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'error' or 'success'

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

  const onChangeStartDate = (event, selectedDate) => {
    setShowStartDatePicker(false);
    if (event.type === 'set') {
      const currentDate = selectedDate || startDate;
      handleStartDateSelection(currentDate);
    }
  };

  const onChangeEndDate = (event, selectedDate) => {
    setShowEndDatePicker(false);
    if (event.type === 'set') {
      const currentDate = selectedDate || endDate;
      handleEndDateSelection(currentDate);
    }
  };

  const handleStartDateSelection = (selectedDate) => {
    const currentDate = new Date();
    if (selectedDate < currentDate) {
      setStartDate(null); // Clear the date
      setMessage('Start date cannot be in the past.');
      setMessageType('error');
    } else {
      setStartDate(selectedDate); // Keep the selected date
      validateEndDate(selectedDate); // Check end date validity
    }
  };

  const handleEndDateSelection = (selectedDate) => {
    const currentDate = new Date();
    if (selectedDate < currentDate) {
      setEndDate(null); // Clear the date
      setMessage('End date cannot be in the past.');
      setMessageType('error');
    } else if (selectedDate < startDate) {
      setEndDate(null); // Clear the date
      setMessage('End date cannot be before start date.');
      setMessageType('error');
    } else {
      setEndDate(selectedDate); // Keep the selected date
      const duration = Math.ceil((selectedDate - startDate) / (1000 * 60 * 60 * 24));
      setMessage(`Your election is in ${duration} ${duration === 1 ? 'day' : 'days'}.`);
      setMessageType('success');
    }
  };

  const validateEndDate = (newStartDate) => {
    if (endDate) {
      const duration = Math.ceil((endDate - newStartDate) / (1000 * 60 * 60 * 24));
      setMessage(`Your election is in ${duration} ${duration === 1 ? 'day' : 'days'}.`);
      setMessageType('success');
    }
  };




  // Image picker for election
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  // Image picker for candidate
  const pickCandidateImage = async (index) => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      const newCandidates = [...candidates];
      newCandidates[index].image = result.assets[0].uri;
      setCandidates(newCandidates);
    }
  };

  // Add a new candidate
  const addCandidate = () => {
    setCandidates([...candidates, { name: '', image: null, faculty: '', level: '' }]);
  };

  // Remove candidate
  const removeCandidate = (index) => {
    const newCandidates = [...candidates];
    newCandidates.splice(index, 1);
    setCandidates(newCandidates);
  };

  // Upload image to Firebase storage and return the download URL
  const uploadImageToStorage = async (imageUri, folder) => {
    const response = await fetch(imageUri);
    const blob = await response.blob();
    const imageRef = ref(storage, `${folder}/${Date.now()}`);
    await uploadBytes(imageRef, blob);
    return await getDownloadURL(imageRef);
  };

  /*
  // Handle form submission
  const handleSubmit = async () => {
    if (!electionName || !startDate || !endDate || !faculty || candidates.length === 0) {
      Alert.alert('Error', 'Please fill all fields and add at least one candidate.');
      return;
    }

    try {
      // Upload election image
      const electionImageUrl = await uploadImageToStorage(image, 'elections');

      // Upload candidate images and prepare candidate data
      const candidateData = await Promise.all(
        candidates.map(async (candidate) => {
          const candidateImageUrl = await uploadImageToStorage(candidate.image, 'candidates');
          return {
            name: candidate.name,
            image: candidateImageUrl,
            faculty: candidate.faculty,
            level: candidate.level
          };
        })
      );

      // Create election in Firestore
      const docRef = await addDoc(collection(db, 'elections'), {
        electionName,
        startDate,
        endDate,
        faculty,
        image: electionImageUrl,
        candidates: candidateData,
        adminId: auth.currentUser.uid,
        adminName: userDetails.fullName,
        adminEmail: userDetails.email,
        adminProfileImage: userDetails.profileImage,
        adminLocation: userDetails.location,
        createdAt: new Date().toDateString(),
      });

      // Clear form and show success alert
      setElectionName('');
      setStartDate('');
      setEndDate('');
      setFaculty('');
      setImage(null);
      setCandidates([{ name: '', image: null, faculty: '', level: '' }]);
      Alert.alert('Success', 'Election created successfully!');
    } catch (error) {
      Alert.alert('Error', 'An error occurred while creating the election.');
      console.error('Error creating election:', error);
    }
  };
*/

const handleSubmit = async () => {
  if (!electionName || !startDate || !endDate || !faculty || candidates.length === 0) {
    Alert.alert('Error', 'Please fill all fields and add at least one candidate.');
    return;
  }

  try {
    // Upload election image
    const electionImageUrl = await uploadImageToStorage(image, 'elections');

    // Upload candidate images and prepare candidate data
    const candidateData = await Promise.all(
      candidates.map(async (candidate) => {
        const candidateImageUrl = await uploadImageToStorage(candidate.image, 'candidates');
        return {
          name: candidate.name,
          image: candidateImageUrl,
          faculty: candidate.faculty,
          level: candidate.level
        };
      })
    );

    // Create election in Firestore
    const docRef = await addDoc(collection(db, 'elections'), {
      electionName,
      startDate,
      endDate,
      faculty,
      image: electionImageUrl,
      candidates: candidateData,
      adminId: auth.currentUser.uid,
      adminName: userDetails.fullName,
      adminEmail: userDetails.email,
      adminProfileImage: userDetails.profileImage,
      adminLocation: userDetails.location,
      createdAt: new Date().toDateString(),
    });

    // Clear form and show success alert
    setElectionName('');
    setStartDate('');
    setEndDate('');
    setFaculty('');
    setImage(null);
    setCandidates([{ name: '', image: null, faculty: '', level: '' }]);
    Alert.alert('Success', 'Election created successfully!');
  } catch (error) {
    Alert.alert('Error', 'An error occurred while creating the election.');
    console.error('Error creating election:', error.message, error.stack);
  }
};


  return (
    <ScrollView style={styles.container}>
     {/* <Text style={styles.title}>Create Election</Text> */}

      <TouchableOpacity onPress={pickImage} style={styles.imagePicker}>
        {image ? (
          <Image source={{ uri: image }} style={styles.image} />
        ) : (
          <Image
            source={require('../../assets/images/default-image.png')}
            style={styles.image}
          />
        )}
        <Ionicons name="camera-outline" size={30} color="white" style={styles.editIcon} />
      </TouchableOpacity>

      

      <View style={styles.inputWrapper}>
        <Ionicons name="pencil" size={24} color="#666" style={styles.icon} />
        <TextInput
          style={styles.input}
          placeholder="Election Name"
          placeholderTextColor="#999"
          value={electionName}
          onChangeText={setElectionName}
        />
      </View>

     {/* <Text style={styles.header}>Select Election Dates</Text> */}
      <Button onPress={() => setShowStartDatePicker(true)} title="Choose Start Date" />
      {showStartDatePicker && (
        <DateTimePicker
          value={startDate || new Date()}
          mode="time"
          display="default"
          onChange={onChangeStartDate}
        />
      )}

      <Button onPress={() => setShowEndDatePicker(true)} title="Choose End Date" />
      {showEndDatePicker && (
        <DateTimePicker
          value={endDate || new Date()}
          mode="time"
          display="default"
          onChange={onChangeEndDate}
        />
      )}

      {message ? (
        <Text style={messageType === 'error' ? styles.errorMessage : styles.successMessage}>
          {message}
        </Text>
      ) : null}

      <Picker
        selectedValue={faculty}
        onValueChange={(itemValue) => setFaculty(itemValue)}
        style={styles.picker}
      >
        <Picker.Item label="Select Faculty" value="" />
        <Picker.Item label="All" value="all" />
        <Picker.Item label="FoCIS" value="FoCIS" />
        <Picker.Item label="FoE" value="FoE" />
        <Picker.Item label="Business" value="Business" />
      </Picker>

      <Text style={styles.subtitle}>Candidates</Text>

      {candidates.map((candidate, index) => (
        <View key={index} style={styles.candidateContainer}>
          <TouchableOpacity onPress={() => pickCandidateImage(index)} style={styles.candidateImagePicker}>
            {candidate.image ? (
              <Image source={{ uri: candidate.image }} style={styles.candidateImage} />
            ) : (
              <Image
                source={require('../../assets/images/default-image.png')}
                style={styles.candidateImage}
              />
            )}
          {/*  <Ionicons name="camera-outline" size={30} color="white" style={styles.editIcon} /> */}
          </TouchableOpacity>

          <TextInput
            style={styles.candidateInput}
            placeholder="Candidate Name"
            value={candidate.name}
            onChangeText={(text) => {
              const newCandidates = [...candidates];
              newCandidates[index].name = text;
              setCandidates(newCandidates);
            }}
          />
          <View style={styles.candidateDetails}>
          <TextInput
              style={styles.candidateInput}
              placeholder="Faculty"
              value={candidate.faculty}
              onChangeText={(text) => {
                const newCandidates = [...candidates];
                newCandidates[index].faculty = text;
                setCandidates(newCandidates);
              }}
            />
            <TextInput
              style={styles.candidateInput}
              placeholder="Level"
              value={candidate.level}
              onChangeText={(text) => {
                const newCandidates = [...candidates];
                newCandidates[index].level = text;
                setCandidates(newCandidates);
              }}
            />
            </View>
          
          <TouchableOpacity onPress={() => removeCandidate(index)} style={styles.deleteButton}>
            <Ionicons name="trash-outline" size={20} color="white" />
          </TouchableOpacity>
        </View>
      ))}

      <TouchableOpacity onPress={addCandidate} style={styles.addButton}>
        <Ionicons name="add-outline" size={20} color="green" />
        <Text style={styles.addButtonText}>Add Candidate</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={handleSubmit} style={styles.submitButton}>
        <Text style={styles.submitButtonText}>Create Election</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8f8f8',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  imagePicker: {
    alignItems: 'center',
    marginBottom: 20,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginBottom: 10,
  },
  editIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 5,
    borderRadius: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 10,
    marginBottom: 20,
    backgroundColor: '#fff',
  },
  picker: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    marginBottom: 20,
    backgroundColor: '#fff',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  candidateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  deleteButton: {
    backgroundColor: '#ff5c5c',
    padding: 10,
    borderRadius: 10,
    marginLeft: 10,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  addButtonText: {
    fontSize: 18,
    marginLeft: 10,
    color: 'green',
  },
  submitButton: {
    backgroundColor: '#28a745',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 20
  },
  submitButtonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },





  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 12,
    height: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 10,
  },
  icon: {
    padding: 4,
  },
  candidateDetails: {
    flex: 1,
  },
  candidateImagePicker: {
    marginRight: 10,
  },
  candidateImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  candidateInput: {
    height: 40,
    borderBottomWidth: 1,
    borderColor: '#ccc',
    marginBottom: 5,
    paddingHorizontal: 5,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  errorMessage: {
    marginTop: 20,
    fontSize: 16,
    color: 'red',
  },
  successMessage: {
    marginTop: 20,
    fontSize: 16,
    color: 'green',
    marginBottom: 5,
    textAlign: 'center',
    fontWeight: 900
  },
});
