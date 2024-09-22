import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  SafeAreaView,
  Dimensions,
  ImageBackground,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { db, auth } from '../../firebase/firebaseConfig';
import { collection, query, where, getDocs, getDoc, doc } from 'firebase/firestore';
// import { useNavigation } from '@react-navigation/native'; // Add this to handle navigation

const { width, height } = Dimensions.get('window');

const VoterHome = ({ navigation }) => {
  const [greeting, setGreeting] = useState('');
  const [totalVotes, setTotalVotes] = useState(0);
  const currentUserId = auth.currentUser.uid;


  const [userDetails, setUserDetails] = useState({});


 // const navigation = useNavigation(); // Hook to handle navigation
  // Get user data from Firebase Auth
  const user = auth.currentUser;


  useEffect(() => {
    // Check if user exists and is verified
    const checkUser = async () => {
      const user = auth.currentUser;

      if (!user || !user.emailVerified) {
        // If user does not exist or email is not verified, navigate to login
        navigation.navigate('Login');
      } else {
        // Fetch user data if verified
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setUserDetails(userDoc.data());
        }
      }
    };

    checkUser();
  }, []);

  const firstName = userDetails?.fullName?.split(' ')[0];

  useEffect(() => {
    // Set greeting based on time of day
    const hours = new Date().getHours();
    if (hours < 12) setGreeting('Good Morning');
    else if (hours < 18) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
  }, []);



  useEffect(() => {
    fetchTotalVotes();
  }, []);

  // Function to fetch the total number of votes
  const fetchTotalVotes = async () => {
    try {
      const userVotesQuery = query(
        collection(db, 'userVotes'),
        where('userId', '==', currentUserId)
      );
      const querySnapshot = await getDocs(userVotesQuery);
      setTotalVotes(querySnapshot.size);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch vote count. Please try again later.');
      console.error('Error fetching votes count:', error);
    }
  };

  return (
    
    <View style={styles.container}>
      <ImageBackground
      source={require('../../assets/images/background2.webp')}
      style={styles.backgroundImage}
      imageStyle={{ opacity: 0.3 }} // Background image opacity
    >
      <View style={styles.overlay} />
      
      {/* Scrollable content */}
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Image
            source={{
              uri: 'https://core-docs.s3.amazonaws.com/new_town_school_district_1_ar/article/image/large_cfd7b20b-02a9-4ff8-9c3e-69f7b0d0ad04.jpg', // Replace with a background image URL
            }}
            style={styles.welcomeImage}
          />
          <Text style={styles.welcomeText}>{`${greeting}, ${firstName}`}</Text>
          <Text style={styles.welcomeSubtitle}>
            You can participate in elections and have your voice heard.
          </Text>
        </View>

        {/* Total Votes Section */}
        <View style={styles.totalVotesSection}>
          <TouchableOpacity style={styles.totalVotesBox}>
            <Text style={styles.totalVotesText}>Total Votes</Text>
            <Text style={styles.voteCount}>{totalVotes}</Text>
          </TouchableOpacity>
        </View>

        {/* Call-to-action Section */}
        <View style={styles.actionSection}>
          <TouchableOpacity
            style={styles.voteButton}
            onPress={() => navigation.navigate('ElectionsDiscovery')} // Replace with actual voting screen
          >
            <Ionicons name="checkmark-circle" size={24} color="#fff" style={styles.voteIcon} />
            <Text style={styles.voteButtonText}>Start Voting</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    
      </ImageBackground>
    </View>
  );
};

// Full Styling for the Voter Home Screen
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

  container: {
    flex: 1,
    backgroundColor: '#f4f4f4',
  },
  scrollViewContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  welcomeSection: {
    height: 250,
    backgroundColor: '#0066cc',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  welcomeImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: width,
    height: 250,
    opacity: 0.1, // Background image opacity
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  welcomeText: {
    fontSize: 28,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
    marginHorizontal: 20,
  },
  totalVotesSection: {
    marginTop: 24,
    marginHorizontal: 20,
  },
  totalVotesBox: {
    backgroundColor: '#007bff',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 6, // Shadow effect
  },
  totalVotesText: {
    fontSize: 22,
    color: '#fff',
    fontWeight: '600',
    marginBottom: 8,
  },
  voteCount: {
    fontSize: 36,
    color: '#fff',
    fontWeight: 'bold',
  },
  actionSection: {
    marginTop: 40,
    marginHorizontal: 20,
    alignItems: 'center',
  },
  voteButton: {
    backgroundColor: '#28a745',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 4,
  },
  voteButtonText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 10,
  },
  voteIcon: {
    marginRight: 8,
  },
});

export default VoterHome;
