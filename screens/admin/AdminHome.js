// Imports remain the same
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  Modal,
  Alert,
  StyleSheet,
  ScrollView,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { auth, db, storage } from '../../firebase/firebaseConfig';// Firebase setup
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  doc,
  getDoc,
  Timestamp,
  updateDoc, 
  deleteDoc
} from 'firebase/firestore';
import * as ImagePicker from 'expo-image-picker';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import DateTimePicker from '@react-native-community/datetimepicker';

// Helper function to format dates (e.g., 'January 1, 2024')
const formatDate = (date) => {
  const hours = date.getHours();
  const minutes = date.getMinutes();

  // Format hours and minutes
  const formattedHours = hours % 12 || 12; // Converts to 12-hour format
  const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes; // Adds leading zero to minutes
  const ampm = hours >= 12 ? 'PM' : 'AM';

  return `${formattedHours}:${formattedMinutes} ${ampm}`;
};

// Helper function to upload images
const uploadImageToStorage = async (imageUri, folderName) => {
  if (imageUri) {
    const response = await fetch(imageUri);
    const blob = await response.blob();
    const filename = imageUri.substring(imageUri.lastIndexOf('/') + 1);
    const storageRef = ref(storage, `${folderName}/${filename}`);
    await uploadBytes(storageRef, blob);
    return await getDownloadURL(storageRef);
  }
  return null;
};

const AdminHome = () => {
  const [elections, setElections] = useState([]);
  const [selectedElection, setSelectedElection] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  
  const [electionResults, setElectionResults] = useState([]);
  const [selectedTab, setSelectedTab] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredElections, setFilteredElections] = useState([]);

   // Form states for editing election
   const [electionName, setElectionName] = useState('');
   const [startDate, setStartDate] = useState(new Date());
   const [endDate, setEndDate] = useState(new Date());
   const [faculty, setFaculty] = useState('');
   const [candidates, setCandidates] = useState([{ name: '', image: null, faculty: '', level: '' }]);
   const [image, setImage] = useState(null);

  const currentUserId = auth.currentUser.uid;

  useEffect(() => {
    fetchElections();
  }, []);

  const fetchElections = async () => {
    const currentDate = new Date();
    const electionsQuery = query(collection(db, 'elections'));
    const querySnapshot = await getDocs(electionsQuery);
    const electionsData = [];
    querySnapshot.forEach((doc) => {
      electionsData.push({ id: doc.id, ...doc.data() });
    });
    setElections(electionsData);
  };

 

  const fetchElectionResults = async (electionId) => {
    try {
      // Step 1: Fetch all votes for the selected election
      const userVotesQuery = query(
        collection(db, 'userVotes'),
        where('electionId', '==', electionId)
      );
      const querySnapshot = await getDocs(userVotesQuery);
  
      // Step 2: Count votes for each candidate
      const candidateVoteCount = {};
      querySnapshot.forEach((doc) => {
        const vote = doc.data();
        const candidateName = vote.candidate.name;
  
        if (!candidateVoteCount[candidateName]) {
          candidateVoteCount[candidateName] = 0;
        }
        candidateVoteCount[candidateName] += 1;
      });
  
      // Step 3: Fetch the election details to get the candidates
      const electionRef = doc(db, 'elections', electionId);
      const electionDoc = await getDoc(electionRef);
      const electionData = electionDoc.data();
      const candidates = electionData.candidates;
  
      // Step 4: Calculate total votes and percentage for each candidate
      const totalVotes = querySnapshot.size;
      const resultsWithPercentage = candidates.map((candidate) => {
        const candidateVotes = candidateVoteCount[candidate.name] || 0;
        const percentage = totalVotes === 0 ? 0 : ((candidateVotes / totalVotes) * 100).toFixed(2);
  
        return {
          ...candidate,
          votes: candidateVotes,
          percentage,
        };
      });
  
      // Step 5: Update state with the results
      setElectionResults(resultsWithPercentage);
    } catch (error) {
      console.error('Error fetching election results:', error);
    }
  };
  
  const openElectionModal = async (election) => {
  
   // if (hasVoted) {
      await fetchElectionResults(election.id); // Fetch results if the user has voted
   // }
   setElectionName(election.electionName);
   setStartDate(election.startDate.toDate());
   setEndDate(election.endDate.toDate());
   setFaculty(election.faculty);
   setCandidates(election.candidates);
   setImage(election.image);

    setSelectedElection(election);
    setModalVisible(true);
  };


   


  useEffect(() => {
    if (searchTerm.length >= 4) {
      filterElections();
    } else {
      setFilteredElections(elections);
    }
  }, [searchTerm, elections]);
  
  const filterElections = () => {
    const lowercasedSearchTerm = searchTerm.toLowerCase();
    
    const filtered = elections.filter(election => {
      // Check if the election name, faculty, or any candidate details match the search term
      const matchElection = election.electionName.toLowerCase().includes(lowercasedSearchTerm);
      const matchFaculty = election.faculty?.toLowerCase().includes(lowercasedSearchTerm);
      const matchCandidate = election.candidates.some(candidate => 
        candidate.name.toLowerCase().includes(lowercasedSearchTerm) || 
        candidate.faculty.toLowerCase().includes(lowercasedSearchTerm) || 
        candidate.level.toString().includes(lowercasedSearchTerm)
      );
      return matchElection || matchFaculty || matchCandidate;
    });
  
    setFilteredElections(filtered);
  };




  // Filter elections based on tabs
  const filterElectionsByTab = (tab) => {
    const currentDate = new Date();
    if (tab === 'All') {
      setFilteredElections(elections);
    } else if (tab === 'Pending') {
      setFilteredElections(
        elections.filter((election) => election.startDate.toDate() > currentDate)
      );
    } else if (tab === 'In Progress') {
      setFilteredElections(
        elections.filter(
          (election) =>
            election.startDate.toDate() <= currentDate &&
            election.endDate.toDate() >= currentDate
        )
      );
    } else if (tab === 'Expired') {
      setFilteredElections(
        elections.filter((election) => election.endDate.toDate() < currentDate)
      );
    }
  };

  // Handle tab selection
  const handleTabSelection = (tab) => {
    setSelectedTab(tab);
    filterElectionsByTab(tab);
  };


  // Handle election update
  const handleUpdateElection = async () => {
    if (!electionName || !startDate || !endDate || !faculty || candidates.length === 0) {
      Alert.alert('Error', 'Please fill all fields and add at least one candidate.');
      return;
    }

    try {
      const electionDocRef = doc(db, 'elections', selectedElection.id);

      // Upload new image if changed
      const electionImageUrl = image !== selectedElection.image
        ? await uploadImageToStorage(image, 'elections')
        : selectedElection.image;

      // Upload new candidate images and prepare candidate data
      const candidateData = await Promise.all(
        candidates.map(async (candidate) => {
          const candidateImageUrl = candidate.image !== selectedElection.candidates.find(c => c.name === candidate.name)?.image
            ? await uploadImageToStorage(candidate.image, 'candidates')
            : candidate.image;

          return {
            name: candidate.name,
            image: candidateImageUrl,
            faculty: candidate.faculty,
            level: candidate.level,
          };
        })
      );

      // Update the election document in Firestore
      await updateDoc(electionDocRef, {
        electionName,
        startDate: Timestamp.fromDate(new Date(startDate)),
        endDate: Timestamp.fromDate(new Date(endDate)),
        faculty,
        image: electionImageUrl,
        candidates: candidateData,
      });

      Alert.alert('Success', 'Election updated successfully!');
      setModalVisible(false);
      fetchElections();
    } catch (error) {
      Alert.alert('Error', 'An error occurred while updating the election.');
      console.error('Error updating election:', error);
    }
  };

  // Handle election deletion
  const handleDeleteElection = async () => {
    try {
      const electionDocRef = doc(db, 'elections', selectedElection.id);
      await deleteDoc(electionDocRef);
      Alert.alert('Success', 'Election deleted successfully!');
      setModalVisible(false);
      fetchElections();
    } catch (error) {
      Alert.alert('Error', 'An error occurred while deleting the election.');
      console.error('Error deleting election:', error);
    }
  };


  // Render tabs
  const renderTabs = () => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsContainer}>
      {['All', 'Pending', 'In Progress', 'Expired'].map((tab) => (
        <TouchableOpacity
          key={tab}
          style={[styles.tabButton, selectedTab === tab && styles.activeTabButton]}
          onPress={() => handleTabSelection(tab)}
        >
          <Text style={[styles.tabText, selectedTab === tab && styles.activeTabText]}>{tab}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );


  
{/*
// with no winner display
  const renderResultsCard = () => (
    <View>
      <Text style={styles.resultTitle}>Election Results</Text>
      {electionResults.map((candidate, index) => (
        <View key={index} style={styles.resultCard}>
          <Image source={{ uri: candidate.image }} style={styles.candidateCardImage} />
          <Text style={styles.candidateName}>{candidate.name}</Text>
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { width: `${candidate.percentage}%` }]} />
          </View>
          <Text style={styles.candidateVotes}>
            {candidate.votes} votes ({candidate.percentage}%)
          </Text>
        </View>
      ))}
      <Text style={styles.totalVotes}>
        Total Votes: {electionResults.reduce((sum, candidate) => sum + candidate.votes, 0)}
      </Text>
    </View>
  );
      */}

  
      const renderResultsCard = () => {
        if (!selectedElection || electionResults.length === 0) return null;
      
        // Find the candidate with the highest votes
        const winnerCandidate = electionResults.reduce((prev, current) => {
          return current.votes > prev.votes ? current : prev;
        });
      
        // Check if the election is still in progress or ended
        const currentDate = new Date();
        const isElectionInProgress = selectedElection.endDate.toDate() > currentDate;
      
        return (
          <View>
            <Text style={styles.resultTitle}>Election Results</Text>
            {electionResults.map((candidate, index) => (
              <View key={index} style={styles.resultCard}>
                <Image source={{ uri: candidate.image }} style={styles.candidateCardImage} />
                <Text style={styles.candidateName}>{candidate.name}</Text>
                <View style={styles.progressBarContainer}>
                  <View style={[styles.progressBar, { width: `${candidate.percentage}%` }]} />
                </View>
                <Text style={styles.candidateVotes}>
                  {candidate.votes} votes ({candidate.percentage}%)
                </Text>
              </View>
            ))}
            <Text style={styles.totalVotes}>
              Total Votes: {electionResults.reduce((sum, candidate) => sum + candidate.votes, 0)}
            </Text>
      
            {/* Display winning or leading candidate */}
            {isElectionInProgress ? (
              <Text style={styles.winnerText}>
                {winnerCandidate.name} is winning the election with {winnerCandidate.votes} votes.
              </Text>
            ) : (
              <Text style={styles.winnerText}>
                {winnerCandidate.name} won the election with {winnerCandidate.votes} votes.
              </Text>
            )}
          </View>
        );
      };
      
  
  const renderElectionCard = ({ item }) => (
    <TouchableOpacity onPress={() => openElectionModal(item)} style={styles.electionCard}>
      <Image source={{ uri: item.image }} style={styles.electionImage} />
      <Text style={styles.electionName}>{item.electionName}</Text>
      <Text style={styles.electionDate}>Ends: {formatDate(item.endDate.toDate())}</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.candidatesList}>
        {item.candidates.map((candidate, index) => (
          <View key={index} style={styles.candidate}>
            <Image source={{ uri: candidate.image }} style={styles.candidateImage} />
          </View>
        ))}
      </ScrollView>
    </TouchableOpacity>
  );


  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={24} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search elections or candidates"
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
      </View>

      {searchTerm.length > 0 && searchTerm.length < 4 && (
        <Text style={styles.searchWarning}>Search term must be at least 4 characters</Text>
      )}

      {searchTerm.length >= 4 && filteredElections.length === 0 && (
        <Text style={styles.noElectionsText}>No election found for "{searchTerm}"</Text>
      )} 


      {renderTabs()}


      <FlatList
        data={filteredElections.length > 0 && filteredElections}
        renderItem={renderElectionCard}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={styles.noElectionsText}>No Elections Available</Text>}
      />

      {selectedElection && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              
                <ScrollView>
                  <Image source={{ uri: selectedElection.image }} style={styles.modalImage} />
                  <Text style={styles.modalTitle}>{selectedElection.electionName}</Text>
                  <View style={styles.dcontainer}>
                    <View style={styles.dateContainer}>
                      <Ionicons name="calendar-outline" size={24} color="#007BFF" />
                      <Text style={styles.startDate}>
                        Start Date: {formatDate(selectedElection.startDate.toDate())}
                      </Text>
                    </View>
                    <View style={styles.dateContainer}>
                      <Ionicons name="time-outline" size={24} color="#FF6347" />
                      <Text style={styles.endDate}>
                        End Date: {formatDate(selectedElection.endDate.toDate())}
                      </Text>
                    </View>
                  </View>
                  {renderResultsCard()}
                  
                  
                  <View style={styles.updateDeleteContainer}>
                  <Text style={styles.modalSubTitle}>Edit Election</Text>
  <TextInput
    style={styles.updateDeleteInput}
    value={electionName}
    onChangeText={setElectionName}
    placeholder="Election Name"
  />

  <View style={styles.updateDeleteDatePickerContainer}>
    <DateTimePicker
      value={startDate}
      mode="time"
      display="default"
      onChange={(event, date) => setStartDate(date || startDate)}
    />
    <DateTimePicker
      value={endDate}
      mode="time"
      display="default"
      onChange={(event, date) => setEndDate(date || endDate)}
    />
  </View>

  <TextInput
    style={styles.updateDeleteInput}
    value={faculty}
    onChangeText={setFaculty}
    placeholder="Faculty"
  />
  <Text style={styles.modalSubTitle}>Edit Candidates</Text>
  {/* Candidate Section */}
  {candidates.map((candidate, index) => (
    <View key={index} style={styles.updateDeleteCandidateContainer}>
      <TextInput
        style={styles.updateDeleteInput}
        value={candidate.name}
        onChangeText={(text) =>
          setCandidates((prev) =>
            prev.map((c, i) => (i === index ? { ...c, name: text } : c))
          )
        }
        placeholder="Candidate Name"
      />
      <TextInput
        style={styles.updateDeleteInput}
        value={candidate.faculty}
        onChangeText={(text) =>
          setCandidates((prev) =>
            prev.map((c, i) => (i === index ? { ...c, faculty: text } : c))
          )
        }
        placeholder="Candidate Faculty"
      />
      <TextInput
        style={styles.updateDeleteInput}
        value={candidate.level}
        onChangeText={(text) =>
          setCandidates((prev) =>
            prev.map((c, i) => (i === index ? { ...c, level: text } : c))
          )
        }
        placeholder="Candidate Level"
      />
    </View>
  ))}

  <TouchableOpacity style={styles.updateDeleteUpdateButton} onPress={handleUpdateElection}>
    <Text style={styles.updateDeleteButtonText}>Update Election</Text>
  </TouchableOpacity>

  <TouchableOpacity style={styles.updateDeleteDeleteButton} onPress={handleDeleteElection}>
    <Text style={styles.updateDeleteButtonText}>Delete Election</Text>
  </TouchableOpacity>
</View>

                </ScrollView>
              

              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

// Updated styles for improved visuals
const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f4f4f4' },
  electionCard: { backgroundColor: '#fff', borderRadius: 8, padding: 16, marginBottom: 16, elevation: 4 },
  electionImage: { width: '100%', height: 150, borderRadius: 8, marginBottom: 8 },
  electionName: { fontSize: 18, fontWeight: 'bold' },
  electionDate: { color: '#666', marginBottom: 8 },
  candidatesList: { flexDirection: 'row' },
  candidate: { marginRight: 8 },
  candidateImage: { width: 30, height: 30, borderRadius: 25 },
  noElectionsText: { textAlign: 'center', fontSize: 18, color: '#666' },
  modalContainer: { flex: 1, justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', padding: 16, borderTopLeftRadius: 16, borderTopRightRadius: 16, elevation: 4, marginTop: 20 },
  modalImage: { width: '100%', height: 200, borderRadius: 8, marginBottom: 16 },
  modalTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  modalInfo: { fontSize: 16, marginBottom: 4 },
  modalSubTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  candidateCard: { flexDirection: 'row', alignItems: 'center', marginBottom: 16,  
  borderWidth: 1, borderColor: '#333',   borderRadius: 10,
  padding: 16,
  marginVertical: 8,
  shadowColor: '#000',
  shadowOffset: {
    width: 0,
    height: 1,
  },
  shadowOpacity: 0.2,
  shadowRadius: 2,
  elevation: 3,
},
  candidateCardImage: { width: 50, height: 50, borderRadius: 25, marginRight: 16 },
  candidateName: { fontSize: 18, fontWeight: 'bold' },
  candidateDetails: { color: '#666' },
  closeButton: { alignSelf: 'center', padding: 12, backgroundColor: '#ff5252', borderRadius: 50, marginTop: 16 },
  resultTitle: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 16 },
  resultCard: { marginBottom: 16, borderWidth: 1, borderColor: '#333',   borderRadius: 10, padding: 16,
  marginVertical: 8,
  shadowColor: '#000',
  shadowOffset: {
    width: 0,
    height: 1,
  },
  shadowOpacity: 0.2,
  shadowRadius: 2,
  elevation: 3,
},
  
  progressBarContainer: { height: 8, backgroundColor: '#e0e0e0', borderRadius: 4, overflow: 'hidden', marginTop: 4, marginBottom: 4 },
  progressBar: { height: '100%', backgroundColor: '#4caf50' },
  candidateVotes: { fontSize: 16, fontWeight: 'bold', marginTop: 4 },
  totalVotes: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', fontSize: 16, marginTop: 8 },

  
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  searchWarning: {
    color: '#ff5252',
    marginBottom: 8,
    textAlign: 'center',
  },


  
  promptText: {
    fontSize: 12,
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },



  dcontainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    margin: 20,
    gap: 1
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    justifyContent: 'flex-start',
  },
  startDate: {
    fontSize: 12,
    color: '#007BFF',
    marginLeft: 2,
    fontWeight: 'bold',
  },
  endDate: {
    fontSize: 12,
    color: '#FF6347',
    marginLeft: 2,
    fontWeight: 'bold',
  },



  tabsContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    height: 55,
  },
  tabButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#ddd',
    marginRight: 8,
    height: 50,
  },
  activeTabButton: {
    backgroundColor: '#007BFF',
  },
  tabText: {
    color: '#333',
    fontSize: 16,
  },
  activeTabText: {
    color: '#fff',
  },

  winnerText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#4caf50', // Green color to indicate the winner
    marginTop: 10,
    textAlign: 'center',
  },
  












  updateDeleteContainer: {
    padding: 20,
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  updateDeleteInput: {
    height: 45,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  updateDeleteDatePickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  updateDeleteCandidateContainer: {
    padding: 15,
    backgroundColor: '#f0f0f5',
    borderColor: '#007BFF',
    borderWidth: 2,
    borderRadius: 10,
    marginBottom: 20,
  },
  updateDeleteUpdateButton: {
    paddingVertical: 12,
    backgroundColor: '#007BFF',
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 1.5,
    elevation: 2,
  },
  updateDeleteDeleteButton: {
    paddingVertical: 12,
    backgroundColor: '#FF6347',
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 1.5,
    elevation: 2,
  },
  updateDeleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AdminHome;