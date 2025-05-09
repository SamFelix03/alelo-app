"use client"

import { useState } from "react"
import { View, Text, Image, TouchableOpacity, SafeAreaView } from "react-native"
import { useNavigation } from "@react-navigation/native"
import { theme } from "../../theme"
import { Ionicons } from "@expo/vector-icons"

// Mock data for customers
const MOCK_CUSTOMERS = [
  {
    id: "1",
    name: "John Doe",
    avatar: "https://via.placeholder.com/50?text=JD",
    lastOrder: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    totalSpent: "$75.50",
    orderCount: 8,
    isLiked: true,
  },
  {
    id: "2",
    name: "Jane Smith",
    avatar: "https://via.placeholder.com/50?text=JS",
    lastOrder: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    totalSpent: "$120.75",
    orderCount: 12,
    isLiked: true,
  },
  {
    id: "3",
    name: "Bob Johnson",
    avatar: "https://via.placeholder.com/50?text=BJ",
    lastOrder: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
    totalSpent: "$45.25",
    orderCount: 4,
    isLiked: false,
  },
  {
    id: "4",
    name: "Alice Williams",
    avatar: "https://via.placeholder.com/50?text=AW",
    lastOrder: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    totalSpent: "$95.00",
    orderCount: 10,
    isLiked: false,
  },
  {
    id: "5",
    name: "Charlie Brown",
    avatar: "https://via.placeholder.com/50?text=CB",
    lastOrder: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    totalSpent: "$35.50",
    orderCount: 3,
    isLiked: true,
  },
]

const CustomersScreen = () => {
  const navigation = useNavigation();
  const [sortBy, setSortBy] = useState('recent'); // 'recent', 'spent', 'distance'
  const [showLikedOnly, setShowLikedOnly] = useState(false);
  const [minOrderCount, setMinOrderCount] = useState(0);
  const [customers, setCustomers] = useState(MOCK_CUSTOMERS);
  
  const formatDate = (date) => {
    const now = new Date();
    const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) {
      return 'Today';
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else {
      return `${diffInDays} days ago`;
    }
  };
  
  const handleSort = (sortType) => {
    setSortBy(sortType);
    
    const sorted = [...MOCK_CUSTOMERS];
    
    if (sortType === 'recent') {
      sorted.sort((a, b) => b.lastOrder - a.lastOrder);
    } else if (sortType === 'spent') {
      sorted.sort((a, b) => Number.parseFloat(b.totalSpent.substring(1)) - Number.parseFloat(a.totalSpent.substring(1)));
    } else if (sortType === 'orders') {
      sorted.sort((a, b) => b.orderCount - a.orderCount);
    }
    
    applyFilters(sorted);
  };
  
  const applyFilters = (customersToFilter = MOCK_CUSTOMERS) => {
    let filtered = [...customersToFilter];
    
    if (showLikedOnly) {
      filtered = filtered.filter(customer => customer.isLiked);
    }
    
    if (minOrderCount > 0) {
      filtered = filtered.filter(customer => customer.orderCount >= minOrderCount);
    }
    
    setCustomers(filtered);
  };
  
  const toggleLikedOnly = () => {
    const newValue = !showLikedOnly;
    setShowLikedOnly(newValue);
    
    let filtered = [...MOCK_CUSTOMERS];
    
    if (newValue) {
      filtered = filtered.filter(customer => customer.isLiked);
    }
    
    if (minOrderCount > 0) {
      filtered = filtered.filter(customer => customer.orderCount >= minOrderCount);
    }
    
    if (sortBy === 'recent') {
      filtered.sort((a, b) => b.lastOrder - a.lastOrder);
    } else if (sortBy === 'spent') {
      filtered.sort((a, b) => Number.parseFloat(b.totalSpent.substring(1)) - Number.parseFloat(a.totalSpent.substring(1)));
    } else if (sortBy === 'orders') {
      filtered.sort((a, b) => b.orderCount - a.orderCount);
    }
    
    setCustomers(filtered);
  };
  
  const setOrderCountFilter = (count) => {
    setMinOrderCount(count);
    
    let filtered = [...MOCK_CUSTOMERS];
    
    if (showLikedOnly) {
      filtered = filtered.filter(customer => customer.isLiked);
    }
    
    filtered = filtered.filter(customer => customer.orderCount >= count);
    
    if (sortBy === 'recent') {
      filtered.sort((a, b) => b.lastOrder - a.lastOrder);
    } else if (sortBy === 'spent') {
      filtered.sort((a, b) => Number.parseFloat(b.totalSpent.substring(1)) - Number.parseFloat(a.totalSpent.substring(1)));
    } else if (sortBy === 'orders') {
      filtered.sort((a, b) => b.orderCount - a.orderCount);
    }
    
    setCustomers(filtered);
  };
  
  const renderCustomerItem = ({ item }) => (
    <View style={styles.customerCard}>
      <View style={styles.customerHeader}>
        <View style={styles.customerInfo}>
          <Image 
            source={{ uri: item.avatar }} 
            style={styles.customerAvatar} 
            accessibilityLabel={`${item.name} avatar`}
          />
          
          <View>
            <Text style={styles.customerName}>{item.name}</Text>
            <Text style={styles.lastOrderText}>Last order: {formatDate(item.lastOrder)}</Text>
          </View>
        </View>
        
        {item.isLiked && (
          <View style={styles.likedBadge}>
            <Ionicons name="star" size={14} color="#FFFFFF" />
            <Text style={styles.likedText}>Liked</Text>
          </View>
        )}
      </View>
      
      <View style={styles.customerStats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{item.totalSpent}</Text>
          <Text style={styles.statLabel}>Total Spent</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{item.orderCount}</Text>
          <Text style={styles.statLabel}>Orders</Text>
        </View>
      </View>
      
      <TouchableOpacity 
        style={styles.messageButton}
        accessibilityLabel={`Message ${item.name} button`}
      >
        <Ionicons name="chatbubble" size={16} color="#FFFFFF" />
        <Text style={styles.messageButtonText}>Message</Text>
      </TouchableOpacity>
    </View>
  );
  
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="people" size={50} color={theme.colors.disabled} />
      <Text style={styles.emptyText}>No customers found</Text>
      <Text style={styles.emptySubtext}>Try adjusting your filters</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Customers</Text>
      </View>
      
      <View style={styles.filtersContainer}>
        <View style={styles.sortContainer}>
          <Text style={styles.sortLabel}>Sort by:</Text>
          
          <View style={styles.sortButtons}>
            <TouchableOpacity 
              style={[
                styles.sortButton,
                sortBy === 'recent' && styles.sortButtonActive,
              ]}
              onPress={() => handleSort('recent')}
              accessibilityLabel="Sort by recent orders"
            >
              <Text style={[
                styles.sortButtonText,
                sortBy === 'recent' && styles.sortButtonTextActive,
              ]}>
                Recent
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.sortButton,
                sortBy === 'spent' && styles.sortButtonActive,
              ]}
              onPress={() => handleSort('spent')}
              accessibilityLabel="Sort by total spent"
            >
              <Text style={[
                styles.sortButtonText,
                sortBy === 'spent' && styles.sortButtonTextActive,
              ]}>
                Spent
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.sortButton,
                sortBy === 'orders' && styles.sortButtonActive,
              ]}
              onPress={() => handleSort('orders')}
              accessibilityLabel="Sort by order count"
            >
              <Text style={[
                styles.sortButtonText,
                sortBy === 'orders' && styles.sortButtonTextActive,
              ]}>
                Orders
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.filterRow}>
          <Text style={styles.filterLabel}>Liked Customers Only</Text>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              showLikedOnly && styles.toggleButtonActive,
            ]}
            onPress={toggleLikedOnly}
            accessibilityLabel="Toggle liked customers only"
          >
            <View style={[
              styles.toggleCircle,
              showLikedOnly && styles.toggleCircleActive,
            ]} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.filterRow}>
          <Text style={styles.filterLabel}>Minimum Orders</Text>
          <View style={styles.orderCountButtons}>
            {[0, 5, 10].map(count => (
              <TouchableOpacity 
                key={count}
                style={[
                  styles.orderCountButton,
                  minOrderCount === count && styles.orderCountButtonActive,
                ]}
                onPress={() => setOrderCountFilter(count)}
                accessibilityLabel={`Set minimum ${count} orders`}
              >
                <Text style={[
                  styles.orderCountButtonText,
                  minOrderCount === count && styles.orderCountButtonTextActive,
                ]}>
                  {count === 0 ?\
