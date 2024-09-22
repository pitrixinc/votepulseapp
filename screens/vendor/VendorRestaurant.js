import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
  Alert,
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
  getDocs,
  query,
  where,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import { auth, db, storage } from '../../firebase/firebaseConfig';

export default function VendorRestaurant() {
  const [foodName, setFoodName] = useState('');
  const [foodCategory, setFoodCategory] = useState('');
  const [foodPrice, setFoodPrice] = useState('');
  const [foodDescription, setFoodDescription] = useState('');
  const [image, setImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [userDetails, setUserDetails] = useState({});
  const [activeTab, setActiveTab] = useState('pending');
  const [foodItems, setFoodItems] = useState([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedFood, setSelectedFood] = useState(null);

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

    const fetchFoodItems = async () => {
      const user = auth.currentUser;
      if (user) {
        const q = query(
          collection(db, 'foods'),
          where('vendorId', '==', user.uid),
          where('status', '==', activeTab)
        );
        const querySnapshot = await getDocs(q);
        const items = [];
        querySnapshot.forEach((doc) => {
          items.push({ id: doc.id, ...doc.data() });
        });
        setFoodItems(items);
      }
    };

    fetchUserData();
    fetchFoodItems();
  }, [activeTab]);

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

  const handleSubmit = async () => {
    if (!foodName || !foodCategory || !foodPrice || !foodDescription) {
      Alert.alert('All fields are required');
      return;
    }
  
    setUploading(true);
    let imageUrl = image;
  
    try {
      // If the image URI starts with 'http', it's already uploaded, no need to re-upload.
      if (!image.startsWith('http')) {
        const response = await fetch(image);
        const blob = await response.blob();
        const imageRef = ref(storage, `foods/${auth.currentUser.uid}/${Date.now()}`);
        await uploadBytes(imageRef, blob);
        imageUrl = await getDownloadURL(imageRef);
      }
  
      const foodRef = collection(db, 'foods');
  
      if (isUpdating && selectedFood) {
        await updateDoc(doc(db, 'foods', selectedFood.id), {
          name: foodName,
          category: foodCategory,
          price: foodPrice,
          description: foodDescription,
          imageUrl, // Use the new or existing image URL
        });
        Alert.alert('Food item updated successfully');
      } else {
        await addDoc(foodRef, {
          name: foodName,
          category: foodCategory,
          price: foodPrice,
          description: foodDescription,
          imageUrl, // Use the new image URL
          vendorId: auth.currentUser.uid,
          vendorName: userDetails.fullName,
          vendorEmail: userDetails.email,
          vendorProfileImage: userDetails.profileImage,
          vendorLocation: userDetails.location,
          status: 'pending',
          createdAt: new Date().toDateString(),
        });
        Alert.alert('Food item added successfully');
      }
  
      setFoodName('');
      setFoodCategory('');
      setFoodPrice('');
      setFoodDescription('');
      setImage(null);
      setIsUpdating(false);
      setSelectedFood(null);
    } catch (error) {
      console.error('Error adding/updating food item:', error);
      Alert.alert('Error adding/updating food item');
    } finally {
      setUploading(false);
    }
  };
  
  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, 'foods', id));
      setFoodItems(foodItems.filter((item) => item.id !== id));
      Alert.alert('Food item deleted successfully');
    } catch (error) {
      console.error('Error deleting food item:', error);
      Alert.alert('Error deleting food item');
    }
  };

  const handleEdit = (food) => {
    setFoodName(food.name);
    setFoodCategory(food.category);
    setFoodPrice(food.price);
    setFoodDescription(food.description);
    setImage(food.imageUrl);
    setIsUpdating(true);
    setSelectedFood(food);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'pending' && styles.activeTab]}
          onPress={() => setActiveTab('pending')}
        >
          <Text style={styles.tabText}>Pending</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'approved' && styles.activeTab]}
          onPress={() => setActiveTab('approved')}
        >
          <Text style={styles.tabText}>Approved</Text>
        </TouchableOpacity>
      </View>

      {foodItems.map((food) => (
        <View key={food.id} style={styles.foodCard}>
          <Image source={{ uri: food.imageUrl }} style={styles.foodImage} />
          <View style={styles.foodDetails}>
            <Text style={styles.foodName}>{food.name}</Text>
            <Text style={styles.foodCategory}>{food.category}</Text>
            <Text style={styles.foodPrice}>${food.price}</Text>
            <Text style={styles.foodDescription}>{food.description}</Text>
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => handleEdit(food)}
              >
                <Ionicons name="pencil" size={20} color="white" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDelete(food.id)}
              >
                <Ionicons name="trash" size={20} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ))}

      <TouchableOpacity onPress={pickImage} style={styles.imagePicker}>
        {image ? (
          <Image source={{ uri: image }} style={styles.image} />
        ) : (
          <Image
            source={require('../../assets/images/default-food-image.jpg')}
            style={styles.image}
          />
        )}
        <Ionicons
          name="camera-outline"
          size={30}
          color="white"
          style={styles.editIcon}
        />
      </TouchableOpacity>

      <TextInput
        placeholder="Enter food name"
        style={styles.input}
        value={foodName}
        onChangeText={setFoodName}
      />

      <Picker
        selectedValue={foodCategory}
        onValueChange={(itemValue) => setFoodCategory(itemValue)}
        style={styles.picker}
      >
        <Picker.Item label="Select category" value="" />
        <Picker.Item label="Breakfast" value="breakfast" />
        <Picker.Item label="Lunch" value="lunch" />
        <Picker.Item label="Dessert" value="dessert" />
        <Picker.Item label="Wine" value="wine" />
        <Picker.Item label="Starters" value="starters" />
        <Picker.Item label="Snacks" value="snacks" />
        <Picker.Item label="Smoothies" value="smoothies" />
        <Picker.Item label="Pizza" value="pizza" />
        <Picker.Item label="Burger" value="burger" />
        <Picker.Item label="Local" value="local" />
        <Picker.Item label="Continental" value="continental" />
        <Picker.Item label="Oriental" value="oriental" />
      </Picker>

      <TextInput
        placeholder="Enter food price"
        style={styles.input}
        value={foodPrice}
        onChangeText={setFoodPrice}
        keyboardType="numeric"
      />

      <TextInput
        placeholder="Enter food description"
        style={styles.textArea}
        value={foodDescription}
        onChangeText={setFoodDescription}
        multiline
      />

      <TouchableOpacity
        style={[styles.button, uploading && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={uploading}
      >
        <Text style={styles.buttonText}>
          {uploading ? 'Uploading...' : isUpdating ? 'Update' : 'Submit'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f0f2f5',
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#ddd',
  },
  activeTab: {
    backgroundColor: '#007bff',
  },
  tabText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  foodCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginBottom: 10,
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 2,
  },
  foodImage: {
    width: 100,
    height: 100,
  },
  foodDetails: {
    flex: 1,
    padding: 10,
  },
  foodName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  foodCategory: {
    fontSize: 14,
    color: '#888',
    marginBottom: 5,
  },
  foodPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  foodDescription: {
    fontSize: 14,
    color: '#666',
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: 10,
  },
  editButton: {
    backgroundColor: '#007bff',
    padding: 8,
    borderRadius: 5,
    marginRight: 5,
  },
  deleteButton: {
    backgroundColor: '#dc3545',
    padding: 8,
    borderRadius: 5,
  },
  imagePicker: {
    marginBottom: 15,
    alignItems: 'center',
  },
  image: {
    width: 150,
    height: 150,
    borderRadius: 75,
    marginBottom: 10,
  },
  editIcon: {
    position: 'absolute',
    bottom: 10,
    right: 10,
  },
  input: {
    marginBottom: 15,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    backgroundColor: '#fff',
  },
  picker: {
    marginBottom: 15,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    backgroundColor: '#fff',
  },
  textArea: {
    marginBottom: 15,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    backgroundColor: '#fff',
    minHeight: 80,
  },
  button: {
    backgroundColor: '#28a745',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
  },
});
