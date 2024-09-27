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
import { db, auth } from '../../firebase/firebaseConfig';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from 'firebase/firestore';

// Helper function to format dates
const formatDate = (date) => {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const formattedHours = hours % 12 || 12;
  const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
  const ampm = hours >= 12 ? 'PM' : 'AM';
  return `${formattedHours}:${formattedMinutes} ${ampm}`;
};

const VoterVotes = () => {
  const [votedElections, setVotedElections] = useState([]);
  const [filteredElections, setFilteredElections] = useState([]);
  const [selectedElection, setSelectedElection] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [electionResults, setElectionResults] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const currentUserId = auth.currentUser.uid;

  useEffect(() => {
    fetchVotedElections();
  }, []);

  const fetchVotedElections = async () => {
    try {
      // Fetch elections the current user has voted in
      const userVotesQuery = query(
        collection(db, 'userVotes'),
        where('userId', '==', currentUserId)
      );
      const querySnapshot = await getDocs(userVotesQuery);
      const electionsData = [];

      for (const docSnapshot of querySnapshot.docs) {
        const voteData = docSnapshot.data();
        const electionRef = doc(db, 'elections', voteData.electionId);
        const electionDoc = await getDoc(electionRef);
        if (electionDoc.exists()) {
          electionsData.push({ id: electionDoc.id, ...electionDoc.data() });
        }
      }

      setVotedElections(electionsData);
      setFilteredElections(electionsData);
    } catch (error) {
      console.error('Error fetching voted elections:', error);
    }
  };

  const fetchElectionResults = async (electionId) => {
    try {
      const userVotesQuery = query(
        collection(db, 'userVotes'),
        where('electionId', '==', electionId)
      );
      const querySnapshot = await getDocs(userVotesQuery);

      const candidateVoteCount = {};
      querySnapshot.forEach((doc) => {
        const vote = doc.data();
        const candidateName = vote.candidate.name;

        if (!candidateVoteCount[candidateName]) {
          candidateVoteCount[candidateName] = 0;
        }
        candidateVoteCount[candidateName] += 1;
      });

      const electionRef = doc(db, 'elections', electionId);
      const electionDoc = await getDoc(electionRef);
      const electionData = electionDoc.data();
      const candidates = electionData.candidates;

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

      setElectionResults(resultsWithPercentage);
    } catch (error) {
      console.error('Error fetching election results:', error);
    }
  };

  const openElectionModal = async (election) => {
    await fetchElectionResults(election.id);
    setSelectedElection(election);
    setModalVisible(true);
  };

  const filterElections = (text) => {
    setSearchTerm(text);

    if (text.length >= 4) {
      const filtered = votedElections.filter((election) => {
        return (
          election.electionName.toLowerCase().includes(text.toLowerCase()) ||
          election.faculty.toLowerCase().includes(text.toLowerCase()) ||
          election.candidates.some((candidate) =>
            candidate.name.toLowerCase().includes(text.toLowerCase())
          )
        );
      });
      setFilteredElections(filtered);
    } else {
      setFilteredElections(votedElections);
    }
  };

/*
  if (!selectedElection || electionResults.length === 0) return null;
  
    // Find the candidate with the highest votes
    const winnerCandidate = electionResults.reduce((prev, current) => {
      return current.votes > prev.votes ? current : prev;
    });
  
    // Check if the election is still in progress or ended
    const currentDate = new Date();
    const isElectionInProgress = selectedElection.endDate.toDate() > currentDate;
*/

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
      {/* Search Section */}
      <View style={styles.searchSection}>
        <Ionicons name="search" size={20} color="#333" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search elections..."
          value={searchTerm}
          onChangeText={filterElections}
        />
      </View>

      {/* Elections List */}
      <FlatList
        data={filteredElections}
        renderItem={renderElectionCard}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <Text style={styles.noElectionsText}>
            {searchTerm.length >= 4 ? 'No Election Found' : 'No Elections Available'}
          </Text>
        }
      />

      {/* Modal for Election Details & Results */}
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
                <View>
                  <Text style={styles.resultTitle}>Election Results</Text>
                  {electionResults.map((candidate, index) => (
                    <View key={index} style={styles.resultCard}>
                      <Image source={{ uri: candidate.image }} style={styles.candidateCardImage} />
                      <Text style={styles.candidateName}>{candidate.name}</Text>
                      <Text>Faculty: {candidate.faculty}</Text>
                      <Text>Level: {candidate.level}</Text>
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
                {/* Display winning or leading candidate 
        {isElectionInProgress ? (
          <Text style={styles.winnerText}>
            {winnerCandidate.name} is winning the election with {winnerCandidate.votes} votes.
          </Text>
        ) : (
          <Text style={styles.winnerText}>
            {winnerCandidate.name} won the election with {winnerCandidate.votes} votes.
          </Text>
        )} */}
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

// Full Styling for MyVotes Screen
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f4f4f4',
  },
  searchSection: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
    elevation: 3,
    alignItems: 'center',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  electionCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    elevation: 4,
  },
  electionImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginBottom: 8,
  },
  electionName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  electionDate: {
    fontSize: 14,
    color: '#555',
    marginBottom: 8,
  },
  candidatesList: {
    flexDirection: 'row',
    marginTop: 8,
  },
  candidate: {
    marginRight: 10,
  },
  candidateImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  noElectionsText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '90%',
    height: '80%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
  },
  modalImage: {
    width: '100%',
    height: 150,
    borderRadius: 10,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  modalInfo: {
    fontSize: 16,
    color: '#555',
    marginBottom: 8,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  resultCard: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
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
  candidateCardImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 8,
  },
  candidateName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  progressBarContainer: {
    height: 10,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#4caf50', // A green color for the progress bar
    borderRadius: 5,
  },
  candidateVotes: {
    fontSize: 14,
    color: '#666',
    textAlign: 'right',
  },
  totalVotes: {
    fontSize: 16,
    color: '#333',
    fontWeight: 'bold',
    marginTop: 10,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#333',
    borderRadius: 50,
    padding: 8,
  },



  dcontainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 20,
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
    fontSize: 13,
    fontWeight: 'bold',
    color: '#4caf50', // Green color to indicate the winner
    marginTop: 10,
    textAlign: 'center',
  },
});

export default VoterVotes;