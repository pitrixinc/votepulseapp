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
import { db, auth } from '../../firebase/firebaseConfig'; // Firebase setup
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  doc,
  getDoc,
  Timestamp,
  onSnapshot,
} from 'firebase/firestore';
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

const ElectionsDiscovery = () => {
  const [elections, setElections] = useState([]);
  const [selectedElection, setSelectedElection] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [electionResults, setElectionResults] = useState([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filteredElections, setFilteredElections] = useState([]);

  const currentUserId = auth.currentUser.uid;

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
    fetchElections();
  }, []);

  /*
  const fetchElections = async () => {
    const currentDate = new Date();
    const electionsQuery = query(collection(db, 'elections'), where('endDate', '>=', currentDate));
    const querySnapshot = await getDocs(electionsQuery);
    const electionsData = [];
    querySnapshot.forEach((doc) => {
      electionsData.push({ id: doc.id, ...doc.data() });
    });
    setElections(electionsData);
  };
  */

  const fetchElections = async () => {
    const currentDate = new Date();
  
    // Listen to the changes in the 'elections' collection
    const unsubscribe = onSnapshot(collection(db, 'elections'), (snapshot) => {
      const electionsData = [];
  
      snapshot.forEach((doc) => {
        const election = { id: doc.id, ...doc.data() };
  
        // Check if the election's faculty is 'all' or matches the user's faculty
        if (
          election.endDate.toDate() >= currentDate && // Check if election is not expired
          (election.faculty === userDetails.faculty || election.faculty === 'all')
        ) {
          electionsData.push(election);
        }
      });
  
      // Update the state with filtered elections
      setElections(electionsData);
    });
  
    return unsubscribe; // Call this to stop listening when necessary
  };
  

  const checkIfVoted = async (electionId) => {
    const userVotesQuery = query(
      collection(db, 'userVotes'),
      where('userId', '==', currentUserId),
      where('electionId', '==', electionId)
    );
    const querySnapshot = await getDocs(userVotesQuery);
    setHasVoted(!querySnapshot.empty);
  };

  const handleVote = async (electionId, candidate) => {
    if (hasVoted) {
      Alert.alert('Already Voted', 'You have already voted for this election.');
      return;
    }
    try {
      await addDoc(collection(db, 'userVotes'), {
        userId: currentUserId,
        electionId,
        candidate,
        voterName: userDetails.fullName,
        timestamp: Timestamp.now(),
      });
      Alert.alert('Success', `You voted for ${candidate.name}`);
      fetchElectionResults(electionId);
      setHasVoted(true);
    } catch (error) {
      console.error('Error voting:', error);
      Alert.alert('Error', 'An error occurred while voting. Please try again.');
    }
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
    await checkIfVoted(election.id);
  
    if (hasVoted) {
      await fetchElectionResults(election.id); // Fetch results if the user has voted
    }
  
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


  
/*
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
  */

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
                  {hasVoted ? (
                    renderResultsCard()
                  ) : (
                    <View>
                      <Text style={styles.modalSubTitle}>Candidates:</Text>
                      <View style={styles.promptContainer}>
                      <Text style={styles.promptText}>
                        Tap on your preferred candidate to vote
                      </Text>
                      </View>
                      {selectedElection.candidates.map((candidate, index) => (
                        <TouchableOpacity
                          key={index}
                          style={styles.candidateCard}
                          onPress={() => handleVote(selectedElection.id, candidate)}
                        >
                          <Image source={{ uri: candidate.image }} style={styles.candidateCardImage} />
                          <View>
                            <Text style={styles.candidateName}>{candidate.name}</Text>
                            <Text style={styles.candidateDetails}>{candidate.faculty}</Text>
                            <Text style={styles.candidateDetails}>Level: {candidate.level}</Text>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

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
  totalVotes: {  fontSize: 20, fontWeight: 'bold', textAlign: 'center', fontSize: 16, marginTop: 8 },

  
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

  winnerText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#4caf50', // Green color to indicate the winner
    marginTop: 10,
    textAlign: 'center',
  },
});

export default ElectionsDiscovery;
