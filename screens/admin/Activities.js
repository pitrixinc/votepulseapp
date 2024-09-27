import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { auth, db } from '../../firebase/firebaseConfig';
import { collection, query, onSnapshot, where, getDoc, doc } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';

export default function Activities() {
  const [activeTab, setActiveTab] = useState('elections'); // Default to 'elections' tab
  const [electionsNotifications, setElectionsNotifications] = useState([]);
  const [votesNotifications, setVotesNotifications] = useState([]);
  const [totalElections, setTotalElections] = useState(0);
  const [totalVotes, setTotalVotes] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalVoters, setTotalVoters] = useState(0);
  const [totalAdmins, setTotalAdmins] = useState(0);

  const [greeting, setGreeting] = useState('');
  const [userDetails, setUserDetails] = useState({});


  const navigation = useNavigation(); // Hook to handle navigation
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
    // Listener for total elections
    const electionsQuery = query(collection(db, 'elections'));
    const unsubscribeElections = onSnapshot(electionsQuery, (snapshot) => {
      const newElections = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setElectionsNotifications(newElections);
      setTotalElections(snapshot.size); // Set total elections
    });

    // Listener for total votes
    const votesQuery = query(collection(db, 'userVotes'));
    const unsubscribeVotes = onSnapshot(votesQuery, (snapshot) => {
      const newVotes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setVotesNotifications(newVotes);
      setTotalVotes(snapshot.size); // Set total votes
    });

    return () => {
      unsubscribeElections();
      unsubscribeVotes();
    };
  }, []);

  useEffect(() => {
    // Fetch total users
    const usersQuery = query(collection(db, 'users'));
    const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
      setTotalUsers(snapshot.size); // Total users
    });

    // Fetch total voters (users whose userType is 'voter')
    const votersQuery = query(collection(db, 'users'), where('userType', '==', 'voter'));
    const unsubscribeVoters = onSnapshot(votersQuery, (snapshot) => {
      setTotalVoters(snapshot.size); // Total voters
    });

    // Fetch total admins (users whose userType is 'admin')
    const adminsQuery = query(collection(db, 'users'), where('userType', '==', 'admin'));
    const unsubscribeAdmins = onSnapshot(adminsQuery, (snapshot) => {
      setTotalAdmins(snapshot.size); // Total admins
    });

    return () => {
      unsubscribeUsers();
      unsubscribeVoters();
      unsubscribeAdmins();
    };
  }, []);


  const renderNotificationCard = (notification, type) => {
    if (type === 'elections') {
      return (
        <View key={notification.id} style={styles.notificationCard}>
          <FontAwesome name="bullhorn" size={24} color="blue" />
          <View style={styles.notificationText}>
            <Text style={styles.notificationTitle}>New Election by {notification.adminName}</Text>
            <Text style={styles.notificationDescription}>Created at: {notification.createdAt}</Text>
          </View>
        </View>
      );
    } else {
      return (
        <View key={notification.id} style={styles.notificationCard}>
          <FontAwesome name="check" size={24} color="green" />
          <View style={styles.notificationText}>
            <Text style={styles.notificationTitle}>Vote by {notification.voterName}</Text>
            <Text style={styles.notificationDescription}>Voted at: {new Date(notification.timestamp.seconds * 1000).toLocaleString()}</Text>
          </View>
        </View>
      );
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* First Section: Stats */}
      <View style={styles.statsSection}>
      <View style={styles.statBox}>
        <Text style={styles.greetingText}>{`${greeting}, ${firstName}`}</Text>
        <Text style={styles.statValue}>{totalUsers}</Text>
        <Text style={styles.statLabel}>Total Users</Text>
      </View>
      </View>
      <View style={styles.statsSection}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{totalElections}</Text>
          <Text style={styles.statLabel}>Total Elections</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{totalVotes}</Text>
          <Text style={styles.statLabel}>Total User Votes</Text>
        </View>
      </View>

      <View style={styles.statsSection}>
      <View style={styles.statBox}>
      <Text style={styles.statValue}>{totalAdmins}</Text>
        <Text style={styles.statLabel}>Total Admins</Text>
      </View>
      <View style={styles.statBox}>
        <Text style={styles.statValue}>{totalVoters}</Text>
        <Text style={styles.statLabel}>Total Voters</Text>
      </View>
      </View>

      

      {/* Second Section: Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'elections' && styles.activeTab]}
          onPress={() => setActiveTab('elections')}
        >
          <Text style={styles.tabText}>Elections</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'votes' && styles.activeTab]}
          onPress={() => setActiveTab('votes')}
        >
          <Text style={styles.tabText}>User Votes</Text>
        </TouchableOpacity>
      </View>

      {/* Notifications Section */}
      <View>
        {activeTab === 'elections' ? (
          <View style={styles.section}>
            {electionsNotifications.length === 0 ? (
              <Text style={styles.noNotifications}>No new elections</Text>
            ) : (
              electionsNotifications.map(election => renderNotificationCard(election, 'elections'))
            )}
          </View>
        ) : (
          <View style={styles.section}>
            {votesNotifications.length === 0 ? (
              <Text style={styles.noNotifications}>No new votes</Text>
            ) : (
              votesNotifications.map(vote => renderNotificationCard(vote, 'votes'))
            )}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
    padding: 15,
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007bff',
  },
  statLabel: {
    fontSize: 14,
    color: '#6c757d',
  },
  tabsContainer: {
    flexDirection: 'row',
    marginBottom: 15,
    justifyContent: 'center',
  },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#ccc',
    borderRadius: 10,
    marginHorizontal: 5,
  },
  activeTab: {
    backgroundColor: '#007bff',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  section: {
    marginBottom: 20,
  },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    alignItems: 'center',
  },
  notificationText: {
    marginLeft: 10,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  notificationDescription: {
    fontSize: 14,
    color: '#666',
  },
  noNotifications: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    marginTop: 20,
  },
  greetingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
});






{/* 
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { db } from '../../firebase/firebaseConfig';
import { collection, query, onSnapshot } from 'firebase/firestore';

export default function Activities() {
  const [activeTab, setActiveTab] = useState('elections'); // Default to 'elections' tab
  const [electionsNotifications, setElectionsNotifications] = useState([]);
  const [votesNotifications, setVotesNotifications] = useState([]);

  useEffect(() => {
    // Listener for new elections
    const electionsQuery = query(collection(db, 'elections'));
    const unsubscribeElections = onSnapshot(electionsQuery, (snapshot) => {
      const newElections = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setElectionsNotifications(newElections);
    });

    // Listener for new votes
    const votesQuery = query(collection(db, 'userVotes'));
    const unsubscribeVotes = onSnapshot(votesQuery, (snapshot) => {
      const newVotes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setVotesNotifications(newVotes);
    });

    return () => {
      unsubscribeElections();
      unsubscribeVotes();
    };
  }, []);

  const renderNotificationCard = (notification, type) => {
    if (type === 'elections') {
      return (
        <View key={notification.id} style={styles.notificationCard}>
          <FontAwesome name="bullhorn" size={24} color="blue" />
          <View style={styles.notificationText}>
            <Text style={styles.notificationTitle}>New Election by {notification.adminName}</Text>
            <Text style={styles.notificationDescription}>Created at: {notification.createdAt}</Text>
          </View>
        </View>
      );
    } else {
      return (
        <View key={notification.id} style={styles.notificationCard}>
          <FontAwesome name="check" size={24} color="green" />
          <View style={styles.notificationText}>
            <Text style={styles.notificationTitle}>Vote by {notification.voterName}</Text>
            <Text style={styles.notificationDescription}>Voted at: {new Date(notification.timestamp.seconds * 1000).toLocaleString()}</Text>
          </View>
        </View>
      );
    }
  };

  return (
    <View style={styles.container}>
      /* Tabs 
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'elections' && styles.activeTab]}
          onPress={() => setActiveTab('elections')}
        >
          <Text style={styles.tabText}>Elections</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'votes' && styles.activeTab]}
          onPress={() => setActiveTab('votes')}
        >
          <Text style={styles.tabText}>User Votes</Text>
        </TouchableOpacity>
      </View>

      {/* Notifications
      <ScrollView>
        {activeTab === 'elections' ? (
          <View style={styles.section}>
            {electionsNotifications.length === 0 ? (
              <Text style={styles.noNotifications}>No new elections</Text>
            ) : (
              electionsNotifications.map(election => renderNotificationCard(election, 'elections'))
            )}
          </View>
        ) : (
          <View style={styles.section}>
            {votesNotifications.length === 0 ? (
              <Text style={styles.noNotifications}>No new votes</Text>
            ) : (
              votesNotifications.map(vote => renderNotificationCard(vote, 'votes'))
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
    padding: 15,
  },
  tabsContainer: {
    flexDirection: 'row',
    marginBottom: 15,
    justifyContent: 'center',
  },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#ccc',
    borderRadius: 10,
    marginHorizontal: 5,
  },
  activeTab: {
    backgroundColor: '#007bff',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  section: {
    marginBottom: 20,
  },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    alignItems: 'center',
  },
  notificationText: {
    marginLeft: 10,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  notificationDescription: {
    fontSize: 14,
    color: '#666',
  },
  noNotifications: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    marginTop: 20,
  },
});
*/}