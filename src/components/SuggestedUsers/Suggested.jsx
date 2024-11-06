import { Avatar, Box, Button, Flex, VStack, Spinner, Text } from "@chakra-ui/react";
import { useState, useEffect } from "react";
import useFollowUser from "../../hooks/useFollowUser";
import useAuthStore from "../../store/authStore";
import { Link } from "react-router-dom";
import { firestore } from "../../firebase/firebase"; // Import firestore
import { collection, getDocs, doc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore"; // Firebase functions to get users

const AllUsersList = () => {
    const authUser = useAuthStore((state) => state.user);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch all users from Firestore
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const usersCollectionRef = collection(firestore, "users");
                const userSnapshot = await getDocs(usersCollectionRef);
                const userList = userSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setUsers(userList);
            } catch (error) {
                console.error("Error fetching users:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, []);

    const onFollowUser = async (user) => {
        const isAlreadyFollowing = user.followers.some(follower => follower.uid === authUser.uid);
        const userRef = doc(firestore, "users", user.id);
        const authUserRef = doc(firestore, "users", authUser.uid);

        try {
            // If already following, unfollow
            if (isAlreadyFollowing) {
                // Unfollow: Remove from target user's followers and remove from authenticated user's following
                await updateDoc(userRef, {
                    followers: arrayRemove({ uid: authUser.uid, username: authUser.username })
                });
                await updateDoc(authUserRef, {
                    following: arrayRemove({ uid: user.id, username: user.username })
                });

                // Update local state
                setUsers((prevUsers) =>
                    prevUsers.map((u) =>
                        u.id === user.id
                            ? {
                                ...u,
                                followers: u.followers.filter(follower => follower.uid !== authUser.uid)
                            }
                            : u
                    )
                );
            } else {
                // Follow: Add to target user's followers and add to authenticated user's following
                await updateDoc(userRef, {
                    followers: arrayUnion({ uid: authUser.uid, username: authUser.username })
                });
                await updateDoc(authUserRef, {
                    following: arrayUnion({ uid: user.id, username: user.username })
                });

                // Update local state
                setUsers((prevUsers) =>
                    prevUsers.map((u) =>
                        u.id === user.id
                            ? {
                                ...u,
                                followers: [...u.followers, { uid: authUser.uid, username: authUser.username }]
                            }
                            : u
                    )
                );
            }
        } catch (error) {
            console.error("Error updating follow status:", error);
        }
    };

    if (!authUser) return null;

    return (
        <Box p={4}>
            <Flex direction="column" gap={4}>
                {/* Show loading spinner if users are being fetched */}
                {loading ? (
                    <Flex justify="center" align="center">
                        <Spinner size="xl" />
                    </Flex>
                ) : (
                    users.map((user) => (
                        <Flex
                            key={user.id}
                            justifyContent="space-between"
                            alignItems="center"
                            w="full"
                            p={2}
                            borderBottom="1px solid gray"
                        >
                            <Flex alignItems="center" gap={2}>
                                <Link to={`/profile/${user.username}`}>
                                    <Avatar size="md" src={user.profilePicURL || "/default-avatar.png"} />
                                </Link>
                                <VStack spacing={2} alignItems={"flex-start"}>
                                    <Link to={`/profile/${user.username}`}>
                                        <Box fontSize={14} fontWeight={"bold"}>
                                            {user.fullName}
                                        </Box>
                                    </Link>
                                    <Text fontSize={12} color={"gray.500"}>
                                        {user.followers.length} followers
                                    </Text>
                                </VStack>
                            </Flex>
                            {authUser.uid !== user.id && (
                                <Button
                                    fontSize={13}
                                    bg={"transparent"}
                                    p={0}
                                    h={"max-content"}
                                    fontWeight={"medium"}
                                    color={"blue.400"}
                                    cursor={"pointer"}
                                    _hover={{ color: "white" }}
                                    onClick={() => onFollowUser(user)}
                                    isLoading={false} // You can manage loading state if needed
                                >
                                    {user.followers.some(follower => follower.uid === authUser.uid)
                                        ? "Unfollow"
                                        : "Follow"}
                                </Button>
                            )}
                        </Flex>
                    ))
                )}
            </Flex>
        </Box>
    );
};

export default AllUsersList;
