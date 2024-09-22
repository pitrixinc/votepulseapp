import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { auth, db } from '../../firebase/firebaseConfig';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

export default function VendorNotifications() {
  const [ordersNotifications, setOrdersNotifications] = useState([]);
  const [salesNotifications, setSalesNotifications] = useState([]);

  useEffect(() => {
    const vendorId = auth.currentUser.uid;

    // Listener for new orders
    const ordersQuery = query(collection(db, 'orders'), where('vendorId', '==', vendorId), where('status', '==', 'pending'));
    const unsubscribeOrders = onSnapshot(ordersQuery, (snapshot) => {
      const newOrders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOrdersNotifications(newOrders);
    });

    // Listener for new sales
    const salesQuery = query(collection(db, 'orders'), where('vendorId', '==', vendorId), where('status', '==', 'delivered'));
    const unsubscribeSales = onSnapshot(salesQuery, (snapshot) => {
      const newSales = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSalesNotifications(newSales);
    });

    return () => {
      unsubscribeOrders();
      unsubscribeSales();
    };
  }, []);

  const renderNotificationCard = (notification, type) => {
    const title = type === 'orders' ? 'New Order' : 'New Sale';
    const description = type === 'orders' ? `New order from ${notification.buyerName}` : `Sale of ${notification.name}`;

    return (
      <View key={notification.id} style={styles.notificationCard}>
        <View style={styles.notificationContent}>
          <FontAwesome name={type === 'orders' ? 'shopping-cart' : 'dollar'} size={24} color={type === 'orders' ? 'blue' : 'green'} />
          <View style={styles.notificationText}>
            <Text style={styles.notificationTitle}>{title}</Text>
            <Text style={styles.notificationDescription}>{description}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Orders Notifications</Text>
        {ordersNotifications.length === 0 ? (
          <Text style={styles.noNotifications}>No new orders</Text>
        ) : (
          ordersNotifications.map(order => renderNotificationCard(order, 'orders'))
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sales Notifications</Text>
        {salesNotifications.length === 0 ? (
          <Text style={styles.noNotifications}>No new sales</Text>
        ) : (
          salesNotifications.map(sale => renderNotificationCard(sale, 'sales'))
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
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
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
  notificationContent: {
    flexDirection: 'row',
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
