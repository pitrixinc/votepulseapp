import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, Image, StyleSheet, Alert } from 'react-native';
import RNPickerSelect from 'react-native-picker-select';
import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import { auth, db } from '../../firebase/firebaseConfig';
import { collection, query, where, getDocs, updateDoc, doc, getDoc } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native'; // Add this to handle navigation

export default function VendorHome() {
  const [greeting, setGreeting] = useState('');
  const [vendorName, setVendorName] = useState('');
  const [totalSales, setTotalSales] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
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

  const fetchVendorData = async (vendorId) => {
    try {
      const ordersQuery = query(collection(db, 'orders'), where('vendorId', '==', vendorId), where('status', '==', 'delivered'));
      const querySnapshot = await getDocs(ordersQuery);
      let sales = 0;
      querySnapshot.forEach(doc => {
        sales += doc.data().price;
      });
      setTotalSales(sales);

      const allOrdersQuery = query(collection(db, 'orders'), where('vendorId', '==', vendorId));
      const allOrdersSnapshot = await getDocs(allOrdersQuery);
      setTotalOrders(allOrdersSnapshot.size);

      const ordersArray = [];
      allOrdersSnapshot.forEach(doc => {
        ordersArray.push({ id: doc.id, ...doc.data() });
      });
      setOrders(ordersArray);
      setFilteredOrders(ordersArray);
    } catch (error) {
      console.error("Error fetching vendor data: ", error);
    }
  };

  const filterOrders = (status) => {
    if (status === 'all') {
      setFilteredOrders(orders);
    } else {
      setFilteredOrders(orders.filter(order => order.status === status));
    }
    setActiveTab(status);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query === '') {
      filterOrders(activeTab);
    } else {
      setFilteredOrders(
        orders.filter(order => order.name.toLowerCase().includes(query.toLowerCase()))
      );
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, { status: newStatus });
      Alert.alert('Success', 'Order status updated successfully');
      fetchVendorData(auth.currentUser.uid);
    } catch (error) {
      Alert.alert('Error', 'Failed to update order status');
      console.error("Error updating order status: ", error);
    }
  };

  const renderOrderCard = (order) => {
    return (
      <View key={order.id} style={styles.orderCard}>
        <Image source={{ uri: order.image }} style={styles.orderImage} />
        <View style={styles.orderDetails}>
          <Text style={styles.orderName}>{order.name}</Text>
          <Text style={styles.orderPrice}>${order.price}</Text>
          <Text style={styles.buyerName}>Buyer: {order.buyerName}</Text>
          <View style={styles.statusContainer}>
            <RNPickerSelect
              onValueChange={(value) => handleStatusChange(order.id, value)}
              items={[
                { label: 'Pending', value: 'pending' },
                { label: 'In Progress', value: 'in progress' },
                { label: 'Delivered', value: 'delivered' },
                { label: 'Canceled', value: 'canceled' },
              ]}
              value={order.status}
              style={pickerSelectStyles}
              useNativeAndroidPickerStyle={false}
              Icon={() => <FontAwesome name="chevron-down" size={20} color="gray" />}
            />
          </View>
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.greetingContainer}>
      <Text style={styles.greetingText}>{`${greeting}, ${firstName}`}</Text>
      </View>

      <View style={styles.summaryContainer}>
        <View style={styles.summaryBox}>
          <Text style={styles.summaryTitle}>Total Sales</Text>
          <Text style={styles.summaryValue}>GHS{totalSales}</Text>
        </View>
        <View style={styles.summaryBox}>
          <Text style={styles.summaryTitle}>Total Orders</Text>
          <Text style={styles.summaryValue}>{totalOrders}</Text>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <FontAwesome name="search" size={24} color="gray" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search Orders"
          value={searchQuery}
          onChangeText={handleSearch}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsContainer}>
        {['all', 'pending', 'in progress', 'delivered', 'canceled'].map((status) => (
          <TouchableOpacity
            key={status}
            style={[styles.tab, activeTab === status && styles.activeTab]}
            onPress={() => filterOrders(status)}
          >
            <Text style={[styles.tabText, activeTab === status && styles.activeTabText]}>
              {status.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.ordersContainer}>
        {filteredOrders.length === 0 ? (
          <Text style={styles.noOrdersText}>No orders found.</Text>
        ) : (
          filteredOrders.map(order => renderOrderCard(order))
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
  greetingContainer: {
    marginBottom: 20,
  },
  greetingText: {
    fontSize: 26,
    fontWeight: '600',
    color: '#333',
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  summaryBox: {
    width: '48%',
    padding: 20,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    alignItems: 'center',
  },
  summaryTitle: {
    fontSize: 16,
    color: '#888',
    marginBottom: 10,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007bff',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  searchInput: {
    flex: 1,
    fontSize: 18,
    paddingLeft: 10,
  },
  tabsContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    marginHorizontal: 5,
    borderRadius: 10,
    backgroundColor: '#e9ecef',
  },
  activeTab: {
    backgroundColor: '#007bff',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#888',
  },
  activeTabText: {
    color: '#ffffff',
  },
  ordersContainer: {
    marginBottom: 20,
  },
  orderCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  orderImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: 15,
  },
  orderDetails: {
    flex: 1,
    justifyContent: 'space-between',
  },
  orderName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  orderPrice: {
    fontSize: 16,
    color: '#007bff',
  },
  buyerName: {
    fontSize: 14,
    color: '#666',
  },
  statusContainer: {
    marginTop: 10,
  },
  noOrdersText: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    marginTop: 20,
  },
});

const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 8,
    color: 'black',
    paddingRight: 30, // to ensure the text is never behind the icon
  },
  inputAndroid: {
    fontSize: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 0.5,
    borderColor: 'gray',
    borderRadius: 8,
    color: 'black',
    paddingRight: 30, // to ensure the text is never behind the icon
  },
  iconContainer: {
    top: 10,
    right: 12,
  },
});
